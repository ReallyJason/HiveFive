#!/usr/bin/env python3
"""
Automated ComfyUI image generation for HiveFive service categories.

Reads prompts from docs/service-image-prompts.md, queues each through the
ComfyUI API (using the z-image-m3 workflow), and saves output as
CATEGORYNAME_##.png in public/services/.

Prerequisites:
    ComfyUI running with: python main.py --lowvram

Usage:
    python generate-service-images.py                      # Generate all (30s cooldown)
    python generate-service-images.py Tutoring Coding      # Specific categories
    python generate-service-images.py --cooldown 45        # Custom cooldown seconds
    python generate-service-images.py --cooldown 0         # No cooldown
    python generate-service-images.py --list               # List categories and counts
    python generate-service-images.py --dry-run            # Preview without generating
"""

import glob
import json
import os
import random
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request

COMFYUI_URL = "http://127.0.0.1:8188"
COMFY_OUTPUT_DIR = os.path.expanduser("~/ComfyUI/output")
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "public", "services")
PROMPTS_FILE = os.path.join(SCRIPT_DIR, "..", "docs", "service-image-prompts.md")

PROMPT_PREFIX = (
    "A professional DSLR photograph, 8K, ultra-detailed, "
    "realistic photography, natural skin texture, shallow depth of field. "
)

PROMPT_SUFFIX = (
    ". Sharp focus, clean detailed image, correct human anatomy, "
    "no text, no watermark, no logos, no motion blur, "
    "no extra limbs or fingers, not blurry, not overexposed."
)

# Per-category lighting, mood, and color grading
CATEGORY_STYLE = {
    "Tutoring":     "Warm soft diffused daylight, inviting amber tones, cozy academic atmosphere, warm color palette",
    "Coding":       "Cool soft ambient lighting, clean blue-teal tones, sleek modern tech atmosphere, cool color palette",
    "Writing":      "Soft natural window light, muted warm tones, calm contemplative literary mood, neutral warm palette",
    "Career":       "Crisp bright professional lighting, clean neutral tones, polished corporate atmosphere, sharp and confident",
    "Design":       "Bright even studio lighting, vibrant bold saturated colors, creative energetic atmosphere, colorful palette",
    "Fitness":      "Bright high-contrast natural light, vivid energetic warm tones, dynamic active mood, high-energy palette",
    "Music":        "Moody warm golden lighting, intimate amber tones, atmospheric cozy studio feel, rich warm palette",
    "Photography":  "Rich golden hour cinematic lighting, warm saturated tones, beautiful soft natural light, cinematic palette",
    "Consulting":   "Clean bright even lighting, cool confident neutral tones, sharp professional business setting, corporate palette",
    "Language":     "Warm inviting soft lighting, rich earthy tones, worldly cultural atmosphere, earthy warm palette",
    "Coaching":     "Bright uplifting natural daylight, warm positive hopeful tones, inspiring open setting, bright warm palette",
    "Beauty":       "Soft diffused even beauty lighting, gentle pastel tones, polished glamorous feel, soft feminine palette",
    "Video":        "Dramatic cinematic lighting, teal and orange color grading, professional production atmosphere, cinematic palette",
    "Cooking":      "Warm directional key light, rich golden-orange appetizing tones, rustic food photography style, warm appetizing palette",
    "Tech Support": "Clean bright overhead lighting, cool blue-white tones, organized modern helpful setting, clean tech palette",
    "Events":       "Vibrant colorful festive lighting, lively saturated tones, high-energy celebration mood, party palette",
    "Errands":      "Bright clear natural daylight, fresh casual everyday tones, outdoor sunny feel, natural daylight palette",
    "Moving":       "Natural honest documentary lighting, real-life warm tones, active busy candid atmosphere, documentary palette",
    "Pet Care":     "Soft warm diffused lighting, gentle heartfelt tones, endearing natural outdoor setting, soft warm palette",
    "Rides":        "Clean bright natural light, fresh open-air tones, casual comfortable urban feel, natural palette",
    "Other":        "Warm directional creative lighting, eclectic handcrafted tones, artisan workshop feel, crafty warm palette",
}

# Z-Image Turbo ignores negative prompts entirely at CFG=1.
# All constraints are in the positive prompt suffix instead.
NEGATIVE_PROMPT = ""


def build_api_prompt(positive_text, negative_text, filename_prefix):
    """Build a ComfyUI API-format prompt matching the z-image-m3 workflow."""
    return {
        "1": {
            "class_type": "UnetLoaderGGUF",
            "inputs": {
                "unet_name": "z-image-turbo-Q5_K_S.gguf"
            }
        },
        "2": {
            "class_type": "CLIPLoaderGGUF",
            "inputs": {
                "clip_name": "Qwen_3_4b-Q8_0.gguf",
                "type": "lumina2"
            }
        },
        "3": {
            "class_type": "VAELoader",
            "inputs": {
                "vae_name": "ae.safetensors"
            }
        },
        "4": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "clip": ["2", 0],
                "text": positive_text
            }
        },
        "5": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "clip": ["2", 0],
                "text": negative_text
            }
        },
        "6": {
            "class_type": "EmptyLatentImage",
            "inputs": {
                "width": 1200,
                "height": 800,
                "batch_size": 1
            }
        },
        "7": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["1", 0],
                "positive": ["4", 0],
                "negative": ["5", 0],
                "latent_image": ["6", 0],
                "seed": random.randint(0, 2**63),
                "steps": 8,
                "cfg": 1,
                "sampler_name": "euler",
                "scheduler": "simple",
                "denoise": 1
            }
        },
        "8": {
            "class_type": "VAEDecodeTiled",
            "inputs": {
                "samples": ["7", 0],
                "vae": ["3", 0],
                "tile_size": 512,
                "overlap": 64,
                "temporal_size": 8,
                "temporal_overlap": 4
            }
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {
                "images": ["8", 0],
                "filename_prefix": filename_prefix
            }
        }
    }


def parse_prompts(md_path):
    """Parse service-image-prompts.md into {category_name: [prompt, ...]}."""
    with open(md_path, "r") as f:
        content = f.read()

    categories = {}
    pattern = re.compile(
        r"### (.+?)\s*\(\d+ prompts?\)\s*\n((?:\s*\d+\..+\n?)+)",
        re.MULTILINE,
    )
    for match in pattern.finditer(content):
        name = match.group(1).strip()
        block = match.group(2)
        prompts = [p.strip() for p in re.findall(r"\d+\.\s+(.+)", block)]
        if prompts:
            categories[name] = prompts

    return categories


def sanitize_category(name):
    """'Tech Support' -> 'TechSupport'"""
    return re.sub(r"\s+", "", name)


def format_eta(seconds):
    """Format seconds into a human-readable ETA string."""
    if seconds < 60:
        return f"{seconds:.0f}s"
    elif seconds < 3600:
        m, s = divmod(int(seconds), 60)
        return f"{m}m{s:02d}s"
    else:
        h, rem = divmod(int(seconds), 3600)
        m = rem // 60
        return f"{h}h{m:02d}m"


def render_progress(done, total, elapsed_total, label="", width=20):
    """Render a progress bar string like: ████████░░░░ 40% | 8/20 total | ~12m30s left"""
    frac = done / total if total else 0
    filled = int(width * frac)
    bar = "\u2588" * filled + "\u2591" * (width - filled)
    pct = frac * 100

    if done > 0 and elapsed_total > 0:
        avg = elapsed_total / done
        remaining = avg * (total - done)
        eta = f"~{format_eta(remaining)} left"
    else:
        eta = "estimating..."

    line = f"  {bar} {pct:4.0f}% | {done}/{total} total | {eta}"
    if label:
        line = f"  {label} {bar} {pct:4.0f}% | {done}/{total} total | {eta}"
    return line


def queue_prompt(prompt_data):
    """POST a prompt to ComfyUI, return prompt_id."""
    payload = json.dumps({"prompt": prompt_data}).encode("utf-8")
    req = urllib.request.Request(
        f"{COMFYUI_URL}/prompt",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read()).get("prompt_id")
    except urllib.error.URLError as e:
        print(f"\n  ERROR: Cannot reach ComfyUI at {COMFYUI_URL}: {e}")
        return None


def wait_for_completion(prompt_id, progress_cb=None, timeout=600):
    """Poll /history/{id} until done or timeout. Calls progress_cb() each poll."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            req = urllib.request.Request(f"{COMFYUI_URL}/history/{prompt_id}")
            with urllib.request.urlopen(req) as resp:
                history = json.loads(resp.read())
                if prompt_id in history:
                    entry = history[prompt_id]
                    status = entry.get("status", {})
                    if status.get("status_str") == "error":
                        msgs = status.get("messages", [])
                        print(f"\n  ERROR from ComfyUI: {msgs}")
                        return None
                    if entry.get("outputs"):
                        return entry
        except urllib.error.URLError:
            pass
        if progress_cb:
            progress_cb()
        time.sleep(3)
    print(f"\n  WARNING: Timeout ({timeout}s) for prompt {prompt_id}")
    return None


def png_to_webp(png_path):
    """Convert a PNG to high-quality lossy WebP (q90, visually indistinguishable)."""
    webp_path = png_path.rsplit(".", 1)[0] + ".webp"
    try:
        subprocess.run(
            ["cwebp", "-q", "90", "-m", "6", png_path, "-o", webp_path],
            check=True,
            capture_output=True,
        )
        png_size = os.path.getsize(png_path)
        webp_size = os.path.getsize(webp_path)
        saved = (1 - webp_size / png_size) * 100 if png_size else 0
        return webp_path, png_size, webp_size, saved
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"\n  WARNING: webp conversion failed: {e}")
        return None


def collect_output(history_entry, category_safe, index):
    """Move the generated image from ComfyUI output to OUTPUT_DIR/CATEGORY_##.png,
    then convert to lossless webp."""
    if not history_entry:
        return False

    images = (
        history_entry.get("outputs", {}).get("9", {}).get("images", [])
    )
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for img in images:
        src_name = img.get("filename", "")
        subfolder = img.get("subfolder", "")
        src_dir = os.path.join(COMFY_OUTPUT_DIR, subfolder) if subfolder else COMFY_OUTPUT_DIR
        src_path = os.path.join(src_dir, src_name)

        # ComfyUI appends _00001_ etc. — if exact path missing, glob for it
        if not os.path.exists(src_path):
            pattern = os.path.join(src_dir, f"{category_safe}_{index:02d}_*.*")
            matches = glob.glob(pattern)
            if matches:
                src_path = matches[0]

        dst_name = f"{category_safe}_{index:02d}.png"
        dst_path = os.path.join(OUTPUT_DIR, dst_name)

        if os.path.exists(src_path):
            shutil.move(src_path, dst_path)
            result = png_to_webp(dst_path)
            if result:
                _, png_kb, webp_kb, saved = result
                print(f"png:{png_kb//1024}KB webp:{webp_kb//1024}KB (-{saved:.0f}%) ", end="")
            return True
        else:
            print(f"\n  WARNING: Output not found at {src_path}")
    return False


def main():
    # Parse flags and positional args
    flags = {}
    args = []
    argv = sys.argv[1:]
    i = 0
    while i < len(argv):
        if argv[i] == "--cooldown" and i + 1 < len(argv):
            flags["cooldown"] = int(argv[i + 1])
            i += 2
        elif argv[i].startswith("--"):
            flags[argv[i]] = True
            i += 1
        else:
            args.append(argv[i])
            i += 1

    list_mode = "--list" in flags
    dry_run = "--dry-run" in flags
    cooldown = flags.get("cooldown", 0)

    categories = parse_prompts(PROMPTS_FILE)
    if not categories:
        print(f"ERROR: No categories parsed from {PROMPTS_FILE}")
        sys.exit(1)

    total = sum(len(v) for v in categories.values())

    if list_mode:
        print(f"{'Category':<20} {'Count':>5}  Filenames")
        print("-" * 60)
        for name, prompts in categories.items():
            safe = sanitize_category(name)
            print(f"{name:<20} {len(prompts):>5}  {safe}_01.webp .. {safe}_{len(prompts):02d}.webp")
        print(f"\nTotal: {len(categories)} categories, {total} images")
        return

    requested = set(args) if args else None
    if requested:
        unknown = requested - set(categories.keys())
        if unknown:
            print(f"WARNING: Unknown categories: {', '.join(unknown)}")

    print(f"Categories: {len(categories)} | Total prompts: {total} | Cooldown: {cooldown}s")
    print(f"Output dir: {os.path.abspath(OUTPUT_DIR)}")
    if dry_run:
        print("** DRY RUN — nothing will be generated **")
    print()

    # Build flat list of work items to get accurate total count
    work_items = []
    for category_name, prompts in categories.items():
        if requested and category_name not in requested:
            continue
        cat_safe = sanitize_category(category_name)
        for i, prompt_text in enumerate(prompts, start=1):
            work_items.append((category_name, cat_safe, i, len(prompts), prompt_text))

    generated = 0
    skipped = 0
    errors = 0
    done_total = 0
    elapsed_total = 0.0
    total_work = len(work_items)
    current_category = None

    for category_name, cat_safe, i, cat_count, prompt_text in work_items:
        if category_name != current_category:
            if current_category is not None:
                print()
            current_category = category_name
            print(f"=== {category_name} ({cat_count} images) ===")

        tag = f"[{i:02d}/{cat_count}]"
        dst_webp = os.path.join(OUTPUT_DIR, f"{cat_safe}_{i:02d}.webp")

        if os.path.exists(dst_webp):
            print(f"  {tag} SKIP (exists): {cat_safe}_{i:02d}.webp")
            skipped += 1
            done_total += 1
            continue

        if dry_run:
            print(f"  {tag} WOULD generate: {cat_safe}_{i:02d}.webp")
            done_total += 1
            continue

        style = CATEGORY_STYLE.get(category_name, "")
        full_prompt = f"{PROMPT_PREFIX}{prompt_text}. {style}{PROMPT_SUFFIX}"
        tmp_prefix = f"_svcgen/{cat_safe}_{i:02d}"

        api_prompt = build_api_prompt(full_prompt, NEGATIVE_PROMPT, tmp_prefix)
        prompt_id = queue_prompt(api_prompt)

        if not prompt_id:
            errors += 1
            done_total += 1
            continue

        # Progress bar callback — redraws on the same line while waiting
        img_label = f"{cat_safe}_{i:02d}"

        def show_progress():
            bar = render_progress(done_total, total_work, elapsed_total, label=f"{tag} {img_label}")
            print(f"\r{bar}", end="", flush=True)

        show_progress()

        t0 = time.time()
        history = wait_for_completion(prompt_id, progress_cb=show_progress)
        elapsed = time.time() - t0
        elapsed_total += elapsed
        done_total += 1

        # Clear the progress line
        print(f"\r{' ' * 100}\r", end="", flush=True)

        if history and collect_output(history, cat_safe, i):
            generated += 1
            print(f"  {tag} {img_label} OK ({elapsed:.1f}s)")
        else:
            errors += 1
            print(f"  {tag} {img_label} FAILED ({elapsed:.1f}s)")

        # GPU cooldown between generations
        if cooldown > 0 and done_total < total_work:
            for sec in range(cooldown, 0, -1):
                bar = render_progress(done_total, total_work, elapsed_total)
                print(f"\r{bar} | cooldown {sec}s ", end="", flush=True)
                time.sleep(1)
            print(f"\r{' ' * 120}\r", end="", flush=True)

    print()

    # Clean up temp subfolder if empty
    tmp_dir = os.path.join(COMFY_OUTPUT_DIR, "_svcgen")
    if os.path.isdir(tmp_dir):
        try:
            os.rmdir(tmp_dir)
        except OSError:
            pass

    print(f"Done! Generated: {generated} | Skipped: {skipped} | Errors: {errors}")


if __name__ == "__main__":
    main()
