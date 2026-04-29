import { useParams, useNavigate, Link, useLocation } from 'react-router';
import { Children, cloneElement, isValidElement, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { NavBar } from '../components/NavBar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, FileText, Code, GitBranch, Database, BookOpen, Shield, Image, ClipboardList, Map as MapIcon, ChevronDown, ChevronUp, Search, CheckCircle2, Circle, UserRound, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { useFeatures } from '../lib/features';
import { ApiError, apiGet, apiPatch } from '../lib/api';
import NotFound from './NotFound';

// @ts-ignore — Vite ?raw imports via @docs alias
import frontendResearch from '@docs/Frontend_Research.md?raw';
// @ts-ignore
import backendGuide from '@docs/HiveFive_Backend_Guide.md?raw';
// @ts-ignore
import githubStandards from '@docs/HiveFive_GitHub_and_Server_Standards.md?raw';
// @ts-ignore
import gitHelper from '@docs/Git_Helper_Guide.md?raw';
// @ts-ignore
import databaseSchema from '@docs/HiveFive_Database_Schema_and_Security.md?raw';
// @ts-ignore
import teamAgreement from '@docs/TEAM_IP_AGREEMENT.md?raw';
// @ts-ignore
import imagePrompts from '@docs/service-image-prompts.md?raw';
// @ts-ignore
import projectAudit from '@docs/HIVEFIVE_PROJECT_AUDIT.md?raw';
// @ts-ignore
import scrumMap from '@docs/HIVEFIVE_SCRUM_RECONSTRUCTION_MAP.md?raw';
// @ts-ignore
import mirrorRebuildGuide from '@docs/HIVEFIVE_MIRROR_REBUILD_GUIDE.md?raw';
// @ts-ignore
import featureTestCases from '@docs/HIVEFIVE_FEATURE_TEST_CASES.md?raw';
// @ts-ignore
import featureProposalPlan from '@docs/HIVEFIVE_FEATURE_PROPOSAL_PLAN.md?raw';

interface DocEntry {
  title: string;
  description: string;
  content: string;
  icon: typeof FileText;
  interactive?: boolean;
}

const DOCS: Record<string, DocEntry> = {
  'mirror-rebuild-guide': {
    title: 'Mirror Rebuild Guide',
    description: 'Feature-by-feature and file-by-file mirror reconstruction map.',
    content: mirrorRebuildGuide,
    icon: MapIcon,
    interactive: true,
  },
  'feature-test-cases': {
    title: 'Feature Test Cases',
    description: 'Evaluator-ready frontend and backend test matrix by feature.',
    content: featureTestCases,
    icon: ClipboardList,
    interactive: true,
  },
  'feature-proposal-plan': {
    title: 'Feature Proposal Plan',
    description: 'PM-facing scope proposal with user stories and frontend/backend plans.',
    content: featureProposalPlan,
    icon: FileText,
    interactive: true,
  },
  'frontend-research': {
    title: 'Frontend Research',
    description: 'Everything you need to go from zero to shipping frontend code.',
    content: frontendResearch,
    icon: Code,
  },
  'backend-guide': {
    title: 'Backend Guide',
    description: 'Build, test, and deploy the PHP + MySQL backend.',
    content: backendGuide,
    icon: FileText,
  },
  'github-server-standards': {
    title: 'GitHub & Server Standards',
    description: 'Git workflow, branch rules, commit standards, and deployment.',
    content: githubStandards,
    icon: GitBranch,
  },
  'git-helper': {
    title: 'Git Helper Script',
    description: 'Interactive command-line tool for common Git workflows.',
    content: gitHelper,
    icon: GitBranch,
  },
  'database-schema': {
    title: 'Database Schema & Security',
    description: 'Complete database schema and setup instructions.',
    content: databaseSchema,
    icon: Database,
  },
  'team-agreement': {
    title: 'Team IP Agreement',
    description: 'Internal IP & ownership terms for the HiveFive team.',
    content: teamAgreement,
    icon: Shield,
  },
  'service-image-prompts': {
    title: 'Service Image Prompts',
    description: 'AI image generation prompts for service category photos.',
    content: imagePrompts,
    icon: Image,
  },
  'project-audit': {
    title: 'Project Audit',
    description: 'Complete feature listing and reconstruction guide for the entire codebase.',
    content: projectAudit,
    icon: ClipboardList,
  },
  'scrum-reconstruction': {
    title: 'Scrum Reconstruction Map',
    description: 'Maps every file and feature from the repo to Scrum Board user stories.',
    content: scrumMap,
    icon: MapIcon,
  },
};

const DOC_ORDER = [
  'mirror-rebuild-guide',
  'feature-test-cases',
  'feature-proposal-plan',
  'scrum-reconstruction',
  'project-audit',
  'frontend-research',
  'backend-guide',
  'github-server-standards',
  'git-helper',
  'database-schema',
  'team-agreement',
  'service-image-prompts',
];

type DocsWorkspaceTabId = 'mirror-guide' | 'tests' | 'other-guides';

interface DocsWorkspaceTab {
  id: DocsWorkspaceTabId;
  label: string;
  description: string;
  icon: typeof BookOpen;
  accent: string;
  background: string;
  border: string;
}

const DOC_WORKSPACE_TABS: DocsWorkspaceTab[] = [
  {
    id: 'mirror-guide',
    label: 'Mirror Guide',
    description: 'Shared packet board with frontend/backend ownership, sprint tags, and completion tracking.',
    icon: BookOpen,
    accent: '#A16207',
    background: '#FFF8EA',
    border: '#FCD34D',
  },
  {
    id: 'tests',
    label: 'Tests',
    description: 'Feature test matrix for frontend, backend, Postman, and DB verification steps.',
    icon: ClipboardList,
    accent: '#0F766E',
    background: '#ECFEFF',
    border: '#67E8F9',
  },
  {
    id: 'other-guides',
    label: 'Other Guides',
    description: 'All of the remaining internal docs and reference guides that do not need a dedicated top-level tab.',
    icon: FileText,
    accent: '#4338CA',
    background: '#EEF2FF',
    border: '#A5B4FC',
  },
];

const DOC_WORKSPACE_PRIMARY_SLUGS = new Set([
  'mirror-rebuild-guide',
  'feature-test-cases',
]);

const OTHER_GUIDES_SLUG = 'other-guides';
const OTHER_GUIDE_ORDER = DOC_ORDER.filter((slug) => !DOC_WORKSPACE_PRIMARY_SLUGS.has(slug));

interface DocSection {
  id: string;
  title: string;
  content: string;
  order: number;
  legacyTrackingIds?: string[];
}

type MarkdownCalloutTone = 'note' | 'tip' | 'important' | 'warning' | 'caution';

interface MarkdownCalloutConfig {
  label: string;
  accent: string;
  border: string;
  background: string;
  text: string;
}

const MARKDOWN_CALLOUTS: Record<MarkdownCalloutTone, MarkdownCalloutConfig> = {
  note: {
    label: 'Note',
    accent: '#1D4ED8',
    border: '#93C5FD',
    background: '#EFF6FF',
    text: '#1E3A8A',
  },
  tip: {
    label: 'Tip',
    accent: '#0F766E',
    border: '#5EEAD4',
    background: '#ECFEFF',
    text: '#115E59',
  },
  important: {
    label: 'Important',
    accent: '#A16207',
    border: '#FCD34D',
    background: '#FFF8EA',
    text: '#92400E',
  },
  warning: {
    label: 'Warning',
    accent: '#C2410C',
    border: '#FDBA74',
    background: '#FFF7ED',
    text: '#9A3412',
  },
  caution: {
    label: 'Caution',
    accent: '#B91C1C',
    border: '#FCA5A5',
    background: '#FEF2F2',
    text: '#991B1B',
  },
};

function getLeadingText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((child) => getLeadingText(child)).join('');
  }

  if (isValidElement(node)) {
    return getLeadingText(node.props.children as ReactNode);
  }

  return '';
}

function stripLeadingMarker(node: ReactNode, markerPattern: RegExp, didStrip = { value: false }): ReactNode {
  if (typeof node === 'string') {
    if (didStrip.value) return node;
    didStrip.value = true;
    return node.replace(markerPattern, '').trimStart();
  }

  if (typeof node === 'number') {
    if (didStrip.value) return node;
    didStrip.value = true;
    return String(node).replace(markerPattern, '').trimStart();
  }

  if (Array.isArray(node)) {
    return node.map((child) => stripLeadingMarker(child, markerPattern, didStrip));
  }

  if (isValidElement(node)) {
    return cloneElement(node, node.props, stripLeadingMarker(node.props.children as ReactNode, markerPattern, didStrip));
  }

  return node;
}

function parseMarkdownCallout(children: ReactNode): { tone: MarkdownCalloutTone; children: ReactNode[] } | null {
  const childArray = Children.toArray(children);
  const firstChild = childArray[0];

  if (!isValidElement(firstChild) || firstChild.type !== 'p') {
    return null;
  }

  const markerPattern = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i;
  const firstParagraphText = getLeadingText(firstChild.props.children as ReactNode).trim();
  const match = firstParagraphText.match(markerPattern);
  if (!match) return null;

  const tone = match[1].toLowerCase() as MarkdownCalloutTone;
  const cleanedFirstParagraph = stripLeadingMarker(firstChild.props.children as ReactNode, markerPattern);
  const cleanedFirstParagraphText = getLeadingText(cleanedFirstParagraph).trim();
  const nextChildren = [...childArray];

  if (cleanedFirstParagraphText.length === 0) {
    nextChildren.shift();
  } else {
    nextChildren[0] = cloneElement(firstChild, firstChild.props, cleanedFirstParagraph);
  }

  return { tone, children: nextChildren };
}

function MarkdownBlockquote({ children }: { children?: ReactNode }) {
  const callout = parseMarkdownCallout(children);

  if (!callout) {
    return <blockquote>{children}</blockquote>;
  }

  const config = MARKDOWN_CALLOUTS[callout.tone];
  const labelStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: config.text,
    backgroundColor: '#FFFFFF',
    border: `1px solid ${config.border}`,
  };

  return (
    <blockquote
      style={{
        margin: '18px 0',
        padding: '16px 18px',
        borderLeft: `4px solid ${config.accent}`,
        border: `1px solid ${config.border}`,
        borderLeftWidth: '4px',
        backgroundColor: config.background,
        borderRadius: '12px',
        color: config.text,
        boxShadow: '0 1px 2px rgba(28,25,23,0.04)',
      }}
    >
      <div style={labelStyle}>{config.label}</div>
      <div style={{ marginTop: '10px' }}>{callout.children}</div>
    </blockquote>
  );
}

const DOC_MARKDOWN_COMPONENTS = {
  blockquote: MarkdownBlockquote,
};

export interface DeveloperOption {
  username: string;
  label: string;
  color: string;
  background: string;
  border: string;
}

interface AssigneeStylePreset {
  color: string;
  background: string;
  border: string;
}

interface SectionTrackingState {
  done?: boolean;
  frontendOwner?: string | null;
  backendOwner?: string | null;
  frontendDone?: boolean;
  backendDone?: boolean;
  sprintTag?: string | null;
}

export interface InternalTeamAccess {
  username: string;
  serverName: string;
}

interface DocsTrackingAccessResponse {
  tracking?: Record<string, unknown>;
  viewer?: string;
  assignees?: string[];
}

const MIRROR_GUIDE_PACKET_ID_ALIASES: Record<string, string[]> = {
  p13: ['p13-my-profile-and-seller-workspace'],
  p14: ['p14-user-profile-reporting-and-impersonation-entry'],
  p43: ['p43-admin-reports-user-moderation-and-impersonation'],
  p44: ['p44-admin-order-explorer-and-system-settings-feature-flags'],
};

export const INTERNAL_TEAM_ACCESS_KEY = 'hive-internal-sprints-access';
export const DOC_SPRINT_TAGS = ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4'] as const;

const ASSIGNEE_STYLE_PRESETS: AssigneeStylePreset[] = [
  {
    color: '#9A3412',
    background: '#FFF7ED',
    border: '#FDBA74',
  },
  {
    color: '#1D4ED8',
    background: '#EFF6FF',
    border: '#93C5FD',
  },
  {
    color: '#0F766E',
    background: '#F0FDFA',
    border: '#5EEAD4',
  },
  {
    color: '#7C3AED',
    background: '#F5F3FF',
    border: '#C4B5FD',
  },
  {
    color: '#BE123C',
    background: '#FFF1F2',
    border: '#FDA4AF',
  },
];

function buildDeveloperOptions(usernames: string[]): DeveloperOption[] {
  return usernames
    .filter((username): username is string => typeof username === 'string' && username.trim().length > 0)
    .map((username, index) => {
      const style = ASSIGNEE_STYLE_PRESETS[index % ASSIGNEE_STYLE_PRESETS.length];
      return {
        username: username.trim(),
        label: username.trim(),
        color: style.color,
        background: style.background,
        border: style.border,
      };
    });
}

function normalizeAssigneeUsername(username?: string | null, assignees: DeveloperOption[] = []): string | null {
  const trimmed = typeof username === 'string' ? username.trim() : '';
  if (!trimmed) return null;

  const match = assignees.find(
    (assignee) => assignee.username.toLowerCase() === trimmed.toLowerCase(),
  );
  return match?.username ?? null;
}

function getAssignee(username?: string | null, assignees: DeveloperOption[] = []): DeveloperOption | null {
  const normalized = normalizeAssigneeUsername(username, assignees);
  if (!normalized) return null;
  return assignees.find((assignee) => assignee.username === normalized) ?? null;
}

function getAssigneeSearchFilter(query: string, assignees: DeveloperOption[] = []): DeveloperOption | null {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return null;

  return assignees.find((assignee) => normalizeSearchText(assignee.username) === normalizedQuery) ?? null;
}

function isStoredInternalTeamAccess(value: unknown): value is InternalTeamAccess {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  const username = typeof record.username === 'string' ? record.username.trim() : '';
  const serverName = typeof record.serverName === 'string' ? record.serverName.trim() : '';
  return username.length > 0 && serverName.length > 0;
}

export function loadInternalTeamAccess(): InternalTeamAccess | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(INTERNAL_TEAM_ACCESS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredInternalTeamAccess(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveInternalTeamAccess(access: InternalTeamAccess | null) {
  if (typeof window === 'undefined') return;

  if (!access) {
    window.localStorage.removeItem(INTERNAL_TEAM_ACCESS_KEY);
    return;
  }

  window.localStorage.setItem(INTERNAL_TEAM_ACCESS_KEY, JSON.stringify(access));
}

function explainInternalAccessError(username: string, serverName: string): string {
  if (!username) {
    return 'Enter your GitHub username first.';
  }

  if (!serverName) {
    return 'Enter the team server name.';
  }

  return 'Access details are invalid. Re-check the username and the team server name.';
}

function canUseDocsAssignmentBoard(access?: InternalTeamAccess | null, assignees: DeveloperOption[] = []): boolean {
  return Boolean(access?.username && access.serverName && assignees.length > 0);
}

function getWorkspaceTabForSlug(slug?: string | null): DocsWorkspaceTabId {
  if (slug === 'mirror-rebuild-guide') return 'mirror-guide';
  if (slug === 'feature-test-cases') return 'tests';
  if (!slug) return 'mirror-guide';
  return 'other-guides';
}

function getWorkspacePathForTab(tabId: DocsWorkspaceTabId, currentOtherGuideSlug?: string | null): string {
  if (tabId === 'mirror-guide') return '/docs/mirror-rebuild-guide';
  if (tabId === 'tests') return '/docs/feature-test-cases';
  if (currentOtherGuideSlug && DOCS[currentOtherGuideSlug] && !DOC_WORKSPACE_PRIMARY_SLUGS.has(currentOtherGuideSlug)) {
    return `/docs/${currentOtherGuideSlug}`;
  }
  return `/docs/${OTHER_GUIDES_SLUG}`;
}

function isMirrorGuidePacket(slug: string, section: DocSection): boolean {
  return slug === 'mirror-rebuild-guide' && /^P\d{2}\.(?:\d+)?\s/.test(section.title);
}

function sanitizeTrackingState(value: unknown, assignees: DeveloperOption[] = []): SectionTrackingState {
  if (!value || typeof value !== 'object') return {};
  const record = value as Record<string, unknown>;
  const frontendOwner = typeof record.frontendOwner === 'string' ? record.frontendOwner : null;
  const backendOwner = typeof record.backendOwner === 'string' ? record.backendOwner : null;
  const sprintTag = typeof record.sprintTag === 'string' ? record.sprintTag.trim() : '';
  return {
    done: record.done === true,
    frontendOwner: frontendOwner && getAssignee(frontendOwner, assignees) ? normalizeAssigneeUsername(frontendOwner, assignees) : null,
    backendOwner: backendOwner && getAssignee(backendOwner, assignees) ? normalizeAssigneeUsername(backendOwner, assignees) : null,
    frontendDone: record.frontendDone === true,
    backendDone: record.backendDone === true,
    sprintTag: DOC_SPRINT_TAGS.includes(sprintTag as (typeof DOC_SPRINT_TAGS)[number]) ? sprintTag : null,
  };
}

function getSectionDone(slug: string, section: DocSection, tracking: SectionTrackingState): boolean {
  if (isMirrorGuidePacket(slug, section)) {
    return Boolean((tracking.frontendDone && tracking.backendDone) || tracking.done);
  }
  return Boolean(tracking.done);
}

function slugifyHeading(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[`*_~]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getCanonicalSectionId(title: string, fallbackIndex: number): { id: string; legacyTrackingIds: string[] } {
  const packetMatch = title.match(/^P(\d{2})\.(\d+)?\s+/i);
  if (packetMatch) {
    const [, major, minor] = packetMatch;
    const id = minor ? `p${major}-${minor}` : `p${major}`;
    const legacyTrackingIds = [slugifyHeading(title), ...(MIRROR_GUIDE_PACKET_ID_ALIASES[id] ?? [])];
    return {
      id,
      legacyTrackingIds: Array.from(new Set(legacyTrackingIds.filter(Boolean))),
    };
  }

  const featureMatch = title.match(/^(\d{1,2})(?:\.(\d+))?\.\s+/);
  if (featureMatch) {
    const [, major, minor] = featureMatch;
    return {
      id: minor ? `f${major.padStart(2, '0')}-${minor}` : `f${major.padStart(2, '0')}`,
      legacyTrackingIds: [],
    };
  }

  const base = slugifyHeading(title) || `section-${fallbackIndex}`;
  return {
    id: `${base}-${fallbackIndex}`,
    legacyTrackingIds: [],
  };
}

function resolveTrackingSectionId(sectionId: string, sections: DocSection[]): string | null {
  if (!sectionId) return null;

  const exactMatch = sections.find((section) => section.id === sectionId);
  if (exactMatch) return exactMatch.id;

  const aliasMap = new Map<string, string>();
  sections.forEach((section) => {
    (section.legacyTrackingIds ?? []).forEach((alias) => {
      aliasMap.set(alias, section.id);
    });
  });

  const legacyBase = sectionId.replace(/-\d+$/, '');
  return aliasMap.get(sectionId) ?? aliasMap.get(legacyBase) ?? null;
}

function buildHydratedTrackingState(
  tracking: Record<string, unknown> | null | undefined,
  sections: DocSection[],
  assignees: DeveloperOption[] = [],
): Record<string, SectionTrackingState> {
  const nextState: Record<string, SectionTrackingState> = {};

  if (!tracking || typeof tracking !== 'object') {
    return nextState;
  }

  Object.entries(tracking).forEach(([sectionId, value]) => {
    const resolvedId = resolveTrackingSectionId(sectionId, sections);
    if (!resolvedId) return;
    nextState[resolvedId] = sanitizeTrackingState(value, assignees);
  });

  return nextState;
}

function parseSections(markdown: string): { intro: string; sections: DocSection[] } {
  const content = markdown.replace(/\r\n/g, '\n');
  const matches = [...content.matchAll(/^##\s+(.+)$/gm)];
  if (matches.length === 0) return { intro: content.trim(), sections: [] };

  const intro = content.slice(0, matches[0].index ?? 0).trim();
  const sections: DocSection[] = [];

  matches.forEach((match, idx) => {
    const title = match[1].trim();
    const start = (match.index ?? 0) + match[0].length + 1;
    const end = idx < matches.length - 1 ? (matches[idx + 1].index ?? content.length) : content.length;
    const sectionContent = content.slice(start, end).trim();
    const { id, legacyTrackingIds } = getCanonicalSectionId(title, idx + 1);
    sections.push({
      id,
      title,
      content: sectionContent,
      order: idx + 1,
      legacyTrackingIds,
    });
  });

  return { intro, sections };
}

function normalizeSearchText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[`*_~]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSearchTokens(input: string): string[] {
  return normalizeSearchText(input).split(' ').filter(Boolean);
}

function isSubsequenceMatch(query: string, target: string): boolean {
  if (!query || !target) return false;
  let queryIndex = 0;

  for (let i = 0; i < target.length && queryIndex < query.length; i += 1) {
    if (target[i] === query[queryIndex]) {
      queryIndex += 1;
    }
  }

  return queryIndex === query.length;
}

function hasBoundedEditDistance(a: string, b: string, maxDistance: number): boolean {
  if (Math.abs(a.length - b.length) > maxDistance) return false;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    let current = [i];
    let rowMin = current[0];

    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      const nextValue = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + substitutionCost,
      );
      current.push(nextValue);
      rowMin = Math.min(rowMin, nextValue);
    }

    if (rowMin > maxDistance) return false;

    for (let j = 0; j < current.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length] <= maxDistance;
}

function searchTokenMatches(queryToken: string, hayToken: string): boolean {
  if (!queryToken || !hayToken) return false;
  if (hayToken === queryToken) return true;
  if (hayToken.includes(queryToken)) return true;
  if (queryToken.length >= 4 && queryToken.includes(hayToken)) return true;
  if (hayToken.startsWith(queryToken) || queryToken.startsWith(hayToken)) return true;
  if (queryToken.length >= 3 && isSubsequenceMatch(queryToken, hayToken)) return true;

  const maxDistance = queryToken.length >= 7 ? 2 : 1;
  if (queryToken.length >= 4 && hasBoundedEditDistance(queryToken, hayToken, maxDistance)) return true;

  return false;
}

function matchesLooseSearch(query: string, textParts: string[]): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const normalizedParts = textParts
    .map((part) => normalizeSearchText(part))
    .filter(Boolean);

  if (normalizedParts.length === 0) return false;

  const normalizedCorpus = normalizedParts.join(' ');
  if (normalizedCorpus.includes(normalizedQuery)) return true;

  const compactQuery = normalizedQuery.replace(/\s+/g, '');
  const compactCorpus = normalizedCorpus.replace(/\s+/g, '');
  if (compactQuery.length >= 4 && compactCorpus.includes(compactQuery)) return true;

  const queryTokens = getSearchTokens(normalizedQuery);
  const hayTokens = Array.from(new Set(normalizedCorpus.split(' ').filter(Boolean)));

  return queryTokens.every((queryToken) => (
    hayTokens.some((hayToken) => searchTokenMatches(queryToken, hayToken))
  ));
}

function OtherGuidesLibrary({ selectedSlug }: { selectedSlug?: string | null }) {
  const [query, setQuery] = useState('');
  const filteredGuides = useMemo(() => {
    return OTHER_GUIDE_ORDER.filter((slug) => {
      const doc = DOCS[slug];
      return matchesLooseSearch(query, [slug, doc.title, doc.description]);
    });
  }, [query]);

  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#4338CA', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
          Other Guides
        </div>
        <div style={{ fontSize: '14px', color: '#57534E', lineHeight: 1.7 }}>
          Everything else lives here: backend setup, Git/deploy standards, proposal planning, audit docs, and the extra internal references that do not need their own dedicated top tab.
        </div>
        {selectedSlug && DOCS[selectedSlug] && (
          <div style={{ fontSize: '13px', color: '#78716C', lineHeight: 1.6, marginTop: '10px' }}>
            You are currently viewing
            {' '}
            <span style={{ fontWeight: 700, color: '#1C1917' }}>{DOCS[selectedSlug].title}</span>
            . Use the button below to go back to the full guide list.
          </div>
        )}
      </div>

      <div
        style={{
          border: '1px solid #E7E5E4',
          borderRadius: '10px',
          backgroundColor: '#FAF8F5',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          marginBottom: '16px',
        }}
      >
        <Search style={{ width: '14px', height: '14px', color: '#A8A29E' }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search other guides..."
          aria-label="Search other guides"
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '13px',
            color: '#1C1917',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredGuides.map((slug) => {
          const doc = DOCS[slug];
          const Icon = doc.icon;
          const selected = selectedSlug === slug;
          return (
            <Link
              key={slug}
              to={`/docs/${slug}`}
              style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '20px 24px', borderRadius: '12px',
                backgroundColor: selected ? '#FFF8EA' : '#FFFFFF',
                border: `1px solid ${selected ? '#E9A020' : '#E7E5E4'}`,
                textDecoration: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#E9A020';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(233,160,32,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = selected ? '#E9A020' : '#E7E5E4';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '44px', height: '44px', borderRadius: '10px',
                  backgroundColor: 'rgba(233,160,32,0.1)',
                }}
              >
                <Icon style={{ width: '22px', height: '22px', color: '#C4850C' }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#1C1917', marginBottom: '2px' }}>
                  {doc.title}
                </div>
                <div style={{ fontSize: '14px', color: '#78716C', lineHeight: 1.6 }}>
                  {doc.description}
                </div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#A16207', whiteSpace: 'nowrap' }}>
                Open Guide
              </div>
            </Link>
          );
        })}
        {filteredGuides.length === 0 && (
          <div
            style={{
              border: '1px dashed #D6D3D1',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              color: '#78716C',
              fontSize: '14px',
            }}
          >
            No guides matched that search.
          </div>
        )}
      </div>
    </div>
  );
}

export function DocViewer({
  slug,
  embedded = false,
  teamAccess,
  assignees = [],
  sharedTrackingSeed,
  sharedTrackingReady = false,
  onSharedTrackingChange,
}: {
  slug: string;
  embedded?: boolean;
  teamAccess?: InternalTeamAccess | null;
  assignees?: DeveloperOption[];
  sharedTrackingSeed?: Record<string, unknown> | null;
  sharedTrackingReady?: boolean;
  onSharedTrackingChange?: (tracking: Record<string, unknown>) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const doc = DOCS[slug];
  const [query, setQuery] = useState('');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [openSectionIds, setOpenSectionIds] = useState<string[]>([]);
  const [sectionTracking, setSectionTracking] = useState<Record<string, SectionTrackingState>>({});
  const [sharedBoardLoading, setSharedBoardLoading] = useState(false);
  const [sharedBoardSaving, setSharedBoardSaving] = useState(false);
  const [sharedBoardError, setSharedBoardError] = useState('');
  const sharedBoardHydratedRef = useRef(false);
  const lastSyncedTrackingRef = useRef('');
  const userModifiedTrackingRef = useRef(false);

  const parsed = useMemo(() => {
    if (!doc?.interactive) return { intro: '', sections: [] as DocSection[] };
    return parseSections(doc.content);
  }, [doc]);

  const storageKey = useMemo(() => `docs-progress:${slug}`, [slug]);
  const assignmentEnabled = slug === 'mirror-rebuild-guide';
  const resolvedTeamAccess = teamAccess ?? null;
  const assignmentBoardVisible = assignmentEnabled && canUseDocsAssignmentBoard(resolvedTeamAccess, assignees);
  const assignmentMutationsDisabled = assignmentEnabled && (!assignmentBoardVisible || sharedBoardLoading);
  const seededSectionTracking = useMemo(
    () => buildHydratedTrackingState(sharedTrackingSeed, parsed.sections, assignees),
    [assignees, parsed.sections, sharedTrackingSeed],
  );
  const effectiveSectionTracking = useMemo(() => {
    if (!assignmentEnabled) return sectionTracking;
    if (Object.keys(sectionTracking).length > 0) return sectionTracking;
    return seededSectionTracking;
  }, [assignmentEnabled, sectionTracking, seededSectionTracking]);

  const sectionStates = useMemo(() => {
    return Object.fromEntries(
      parsed.sections.map((section) => {
        const tracking = effectiveSectionTracking[section.id] ?? {};
        const done = getSectionDone(slug, section, tracking);
        const assigneeMode = isMirrorGuidePacket(slug, section);
        return [
          section.id,
          {
            tracking,
            done,
            assigneeMode,
          },
        ];
      }),
    ) as Record<string, { tracking: SectionTrackingState; done: boolean; assigneeMode: boolean }>;
  }, [effectiveSectionTracking, parsed.sections, slug]);

  useEffect(() => {
    if (!doc?.interactive) return;
    setQuery('');
    setShowPendingOnly(false);
    setOpenSectionIds(parsed.sections.slice(0, 2).map((section) => section.id));
  }, [doc?.interactive, parsed.sections, slug]);

  useEffect(() => {
    if (!doc?.interactive) return;
    try {
      if (assignmentEnabled) {
        if (!assignmentBoardVisible) {
          setSectionTracking({});
          setSharedBoardLoading(false);
          setSharedBoardSaving(false);
          setSharedBoardError('');
          sharedBoardHydratedRef.current = false;
          lastSyncedTrackingRef.current = JSON.stringify({});
          return;
        }

        setSharedBoardError('');
        setSectionTracking({});
        sharedBoardHydratedRef.current = false;
        userModifiedTrackingRef.current = false;

        const hydrateSharedTracking = (tracking: Record<string, unknown> | null | undefined) => {
          const nextState = buildHydratedTrackingState(tracking, parsed.sections, assignees);
          setSectionTracking(nextState);
          lastSyncedTrackingRef.current = JSON.stringify(nextState);
          sharedBoardHydratedRef.current = true;
          setSharedBoardLoading(false);
        };

        if (!sharedTrackingReady) {
          setSharedBoardLoading(true);
          return;
        }

        hydrateSharedTracking(sharedTrackingSeed);
        return;
      }

      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setSectionTracking({});
        return;
      }
      const saved: unknown = JSON.parse(raw);
      const validIds = new Set(parsed.sections.map((section) => section.id));

      if (Array.isArray(saved)) {
        const migratedEntries = saved
          .filter((id): id is string => typeof id === 'string')
          .filter((id) => validIds.has(id))
          .map((id) => [id, { done: true } satisfies SectionTrackingState]);
        setSectionTracking(Object.fromEntries(migratedEntries));
        return;
      }

      if (!saved || typeof saved !== 'object') {
        setSectionTracking({});
        return;
      }

      const nextState: Record<string, SectionTrackingState> = {};
      Object.entries(saved as Record<string, unknown>).forEach(([sectionId, value]) => {
        if (!validIds.has(sectionId)) return;
        nextState[sectionId] = sanitizeTrackingState(value, assignees);
      });
      setSectionTracking(nextState);
    } catch {
      setSectionTracking({});
    }
  }, [assignmentBoardVisible, assignmentEnabled, assignees, doc?.interactive, parsed.sections, sharedTrackingReady, sharedTrackingSeed, slug, storageKey]);

  useEffect(() => {
    if (!doc?.interactive || assignmentEnabled) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(sectionTracking));
    } catch {
      // Ignore localStorage write errors.
    }
  }, [assignmentEnabled, sectionTracking, doc?.interactive, storageKey]);

  useEffect(() => {
    if (!doc?.interactive || !assignmentEnabled || !assignmentBoardVisible || !sharedBoardHydratedRef.current) return;
    if (!userModifiedTrackingRef.current) return;
    const serialized = JSON.stringify(sectionTracking);
    if (serialized === lastSyncedTrackingRef.current) return;

    userModifiedTrackingRef.current = false;
    let cancelled = false;
    setSharedBoardSaving(true);
    setSharedBoardError('');

    apiPatch<{ tracking?: Record<string, unknown> }>('/internal/docs-tracking.php', {
      doc_slug: slug,
      username: resolvedTeamAccess?.username,
      server_name: resolvedTeamAccess?.serverName,
      tracking: sectionTracking,
    })
      .then((response) => {
        if (cancelled) return;
        if (response.tracking && typeof response.tracking === 'object') {
          onSharedTrackingChange?.(response.tracking);
        }
        lastSyncedTrackingRef.current = serialized;
        setSharedBoardSaving(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setSharedBoardSaving(false);
        setSharedBoardError(error instanceof ApiError ? error.message : 'Shared assignment board could not be saved.');
      });

    return () => {
      cancelled = true;
    };
  }, [assignmentBoardVisible, assignmentEnabled, doc?.interactive, onSharedTrackingChange, resolvedTeamAccess?.serverName, resolvedTeamAccess?.username, sectionTracking, slug]);

  const filteredSections = useMemo(() => {
    if (!doc?.interactive) return [] as DocSection[];
    const assigneeFilter = getAssigneeSearchFilter(query, assignees);
    return parsed.sections.filter((section) => {
      const { tracking, done, assigneeMode } = sectionStates[section.id] ?? {
        tracking: {},
        done: false,
        assigneeMode: false,
      };
      const searchParts = [
        section.title,
        section.content,
        section.id,
        `section ${section.order}`,
        done ? 'done complete finished' : 'pending incomplete not-complete',
      ];

      if (assigneeMode) {
        searchParts.push(
          'frontend',
          'backend',
          tracking.frontendOwner ?? '',
          tracking.backendOwner ?? '',
          tracking.sprintTag ?? '',
          tracking.frontendDone ? 'frontend complete frontend done' : 'frontend pending frontend assigned frontend work',
          tracking.backendDone ? 'backend complete backend done' : 'backend pending backend assigned backend work',
        );
      }

      const matchesOwner = !assigneeFilter || (
        assigneeMode
        && (
          tracking.frontendOwner?.toLowerCase() === assigneeFilter.username.toLowerCase()
          || tracking.backendOwner?.toLowerCase() === assigneeFilter.username.toLowerCase()
        )
      );
      const matchesQuery = assigneeFilter ? matchesOwner : matchesLooseSearch(query, searchParts);
      const matchesPending = !showPendingOnly || !done;
      return matchesQuery && matchesPending;
    });
  }, [assignees, doc?.interactive, parsed.sections, query, sectionStates, showPendingOnly]);

  const completionPercent = parsed.sections.length === 0
    ? 0
    : Math.round((parsed.sections.filter((section) => sectionStates[section.id]?.done).length / parsed.sections.length) * 100);

  const completedSectionCount = useMemo(
    () => parsed.sections.filter((section) => sectionStates[section.id]?.done).length,
    [parsed.sections, sectionStates],
  );

  const assignedFrontendCount = useMemo(
    () => parsed.sections.filter((section) => {
      if (!isMirrorGuidePacket(slug, section)) return false;
      return Boolean(sectionStates[section.id]?.tracking.frontendOwner);
    }).length,
    [parsed.sections, sectionStates, slug],
  );

  const assignedBackendCount = useMemo(
    () => parsed.sections.filter((section) => {
      if (!isMirrorGuidePacket(slug, section)) return false;
      return Boolean(sectionStates[section.id]?.tracking.backendOwner);
    }).length,
    [parsed.sections, sectionStates, slug],
  );

  const packetSectionCount = useMemo(
    () => parsed.sections.filter((section) => isMirrorGuidePacket(slug, section)).length,
    [parsed.sections, slug],
  );

  useEffect(() => {
    if (!doc?.interactive) return;
    const hash = location.hash.replace(/^#/, '');
    if (!hash) return;
    const target = parsed.sections.find((section) => section.id === hash);
    if (!target) return;
    setOpenSectionIds((prev) => (prev.includes(hash) ? prev : [...prev, hash]));
    const timer = window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
    return () => window.clearTimeout(timer);
  }, [doc?.interactive, parsed.sections, location.hash]);

  const updateSectionTracking = (sectionId: string, updater: (current: SectionTrackingState) => SectionTrackingState) => {
    userModifiedTrackingRef.current = true;
    setSectionTracking((prev) => {
      const baseState = Object.keys(prev).length === 0 ? effectiveSectionTracking : prev;
      const current = baseState[sectionId] ?? {};
      return {
        ...baseState,
        [sectionId]: updater(current),
      };
    });
  };

  const resetTracking = () => {
    setSectionTracking({});
  };

  const jumpToSection = (sectionId: string) => {
    setOpenSectionIds((prev) => (prev.includes(sectionId) ? prev : [...prev, sectionId]));
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 20);
  };

  const isEmbedded = embedded || new URLSearchParams(location.search).get('embed') === '1';

  if (!doc) {
    return (
      <div style={{ minHeight: isEmbedded ? 'auto' : '100vh', backgroundColor: isEmbedded ? 'transparent' : '#FAF8F5' }}>
        {!isEmbedded && <NavBar />}
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', color: '#1C1917', marginBottom: '8px' }}>Document not found</h1>
          <p style={{ color: '#78716C', marginBottom: '24px' }}>The document you're looking for doesn't exist.</p>
          {!isEmbedded && <Link to="/docs" style={{ color: '#E9A020', textDecoration: 'underline' }}>Back to docs</Link>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: isEmbedded ? 'auto' : '100vh', backgroundColor: isEmbedded ? 'transparent' : '#FAF8F5' }}>
      {!isEmbedded && <NavBar />}

      {!isEmbedded && (
        <section style={{ backgroundColor: '#1C1917', paddingTop: '64px', paddingBottom: '96px' }}>
          <div style={{ maxWidth: '768px', margin: '0 auto', padding: '0 16px', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '64px', height: '64px', borderRadius: '50%',
                backgroundColor: 'rgba(233,160,32,0.15)', marginBottom: '24px',
              }}
            >
              <doc.icon style={{ width: '32px', height: '32px', color: '#E9A020' }} />
            </div>
            <h1
              className="font-display italic"
              style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#FAF8F5', letterSpacing: '-0.025em', marginBottom: '16px' }}
            >
              {doc.title}
            </h1>
            <p style={{ color: '#78756E', fontSize: '18px' }}>
              {doc.description}
            </p>
          </div>
        </section>
      )}

      {/* Markdown content */}
      <section style={{ maxWidth: doc.interactive ? '1080px' : '768px', margin: '0 auto', padding: isEmbedded ? '16px 0 0' : '48px 16px 64px' }}>
        {doc.interactive ? (
          <>
            <div
              style={{
                border: '1px solid #E7E5E4',
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                padding: '18px 18px 16px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(233,160,32,0.14)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#C4850C',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {completionPercent}%
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1917' }}>
                      Progress: {completedSectionCount}/{parsed.sections.length} sections done
                    </div>
                    <div style={{ fontSize: '12px', color: '#78716C' }}>
                      {assignmentEnabled
                        ? 'Tap a packet to open it. Frontend and backend owners are shared through Hive’s private tracker, and typing a username or sprint tag filters the matching work.'
                        : 'Tap a section to open it. Use checks to track what you finished.'}
                    </div>
                    {assignmentEnabled && (
                      <div style={{ fontSize: '12px', color: '#78716C', marginTop: '4px' }}>
                        Frontend claimed: {assignedFrontendCount}/{packetSectionCount} packets. Backend claimed: {assignedBackendCount}/{packetSectionCount} packets.
                      </div>
                    )}
                    {assignmentEnabled && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: sharedBoardError ? '#B91C1C' : '#78716C',
                          marginTop: '4px',
                        }}
                      >
                        {!assignmentBoardVisible
                          ? 'Internal team assignment board is only available after entering an approved GitHub username and the team server name.'
                          : sharedBoardLoading
                          ? 'Loading shared assignment board...'
                          : sharedBoardSaving
                            ? 'Saving shared assignment board...'
                            : sharedBoardError
                              ? sharedBoardError
                              : 'Shared assignment board is live for the whole Hive team workspace.'}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setOpenSectionIds(parsed.sections.map((section) => section.id))}
                    style={{
                      border: '1px solid #E7E5E4',
                      backgroundColor: '#FFFFFF',
                      color: '#57534E',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderRadius: '9999px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    Expand All
                  </button>
                  <button
                    onClick={() => setOpenSectionIds([])}
                    style={{
                      border: '1px solid #E7E5E4',
                      backgroundColor: '#FFFFFF',
                      color: '#57534E',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderRadius: '9999px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    Collapse All
                  </button>
                  <button
                    onClick={resetTracking}
                    disabled={assignmentMutationsDisabled}
                    style={{
                      border: '1px solid #E7E5E4',
                      backgroundColor: assignmentMutationsDisabled ? '#F5F5F4' : '#FFFFFF',
                      color: assignmentMutationsDisabled ? '#A8A29E' : '#57534E',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderRadius: '9999px',
                      padding: '6px 10px',
                      cursor: assignmentMutationsDisabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {assignmentEnabled ? 'Reset Tracking' : 'Reset Checks'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div
                  style={{
                    flex: '1 1 280px',
                    minWidth: 0,
                    border: '1px solid #E7E5E4',
                    borderRadius: '10px',
                    backgroundColor: '#FAF8F5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                  }}
                >
                  <Search style={{ width: '14px', height: '14px', color: '#A8A29E' }} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={assignmentEnabled ? 'Search features, files, usernames, API names...' : 'Search features, files, API names...'}
                    aria-label="Search sections"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: '13px',
                      color: '#1C1917',
                    }}
                  />
                </div>

                <button
                  onClick={() => setShowPendingOnly((prev) => !prev)}
                  style={{
                    border: '1px solid',
                    borderColor: showPendingOnly ? '#E9A020' : '#E7E5E4',
                    backgroundColor: showPendingOnly ? '#FFF8EA' : '#FFFFFF',
                    color: showPendingOnly ? '#C4850C' : '#57534E',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '9999px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {showPendingOnly ? 'Showing Pending Only' : 'Show Pending Only'}
                </button>
              </div>

              {assignmentBoardVisible && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#78716C' }}>
                    Quick owner filter:
                  </div>
                  {assignees.map((assignee) => {
                    const selected = query.trim().toLowerCase() === assignee.username.toLowerCase();
                    return (
                      <button
                        key={assignee.username}
                        onClick={() => setQuery((prev) => (
                          prev.trim().toLowerCase() === assignee.username.toLowerCase() ? '' : assignee.username
                        ))}
                        style={{
                          border: '1px solid',
                          borderColor: selected ? assignee.color : assignee.border,
                          backgroundColor: selected ? assignee.background : '#FFFFFF',
                          color: assignee.color,
                          fontSize: '12px',
                          fontWeight: 700,
                          borderRadius: '9999px',
                          padding: '7px 11px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <UserRound style={{ width: '12px', height: '12px' }} />
                        {assignee.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {parsed.intro && (
              <div
                style={{
                  border: '1px solid #E7E5E4',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '18px',
                  marginBottom: '18px',
                }}
              >
                <div className="doc-prose">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={DOC_MARKDOWN_COMPONENTS}>{parsed.intro}</ReactMarkdown>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '14px' }}>
              {parsed.sections.map((section) => {
                const completed = Boolean(sectionStates[section.id]?.done);
                const tracking = sectionStates[section.id]?.tracking ?? {};
                const frontendOwner = getAssignee(tracking.frontendOwner, assignees);
                const backendOwner = getAssignee(tracking.backendOwner, assignees);
                return (
                  <button
                    key={section.id}
                    onClick={() => jumpToSection(section.id)}
                    style={{
                      border: '1px solid',
                      borderColor: completed ? '#34D399' : '#E7E5E4',
                      backgroundColor: completed ? '#ECFDF5' : '#FFFFFF',
                      color: completed ? '#047857' : '#57534E',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderRadius: '9999px',
                      padding: '7px 11px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {section.order}. {section.title}
                    {assignmentBoardVisible && isMirrorGuidePacket(slug, section) && (
                      <span style={{ marginLeft: '8px', color: '#A8A29E' }}>
                        [{frontendOwner?.label ?? 'FE ?'} | {backendOwner?.label ?? 'BE ?'}]
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredSections.length === 0 ? (
                <div
                  style={{
                    border: '1px dashed #D6D3D1',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '28px',
                    textAlign: 'center',
                    color: '#78716C',
                    fontSize: '14px',
                  }}
                >
                  No sections matched your current filters.
                </div>
              ) : (
                filteredSections.map((section) => {
                  const isOpen = openSectionIds.includes(section.id);
                  const state = sectionStates[section.id] ?? { tracking: {}, done: false, assigneeMode: false };
                  const tracking = state.tracking;
                  const completed = state.done;
                  const assigneeMode = state.assigneeMode;
                  const frontendOwner = getAssignee(tracking.frontendOwner, assignees);
                  const backendOwner = getAssignee(tracking.backendOwner, assignees);
                  const packetStatus = completed
                    ? { label: 'Packet Complete', color: '#047857', background: '#ECFDF5', border: '#34D399' }
                    : frontendOwner || backendOwner || tracking.frontendDone || tracking.backendDone
                      ? { label: 'In Progress', color: '#B45309', background: '#FFF7ED', border: '#FDBA74' }
                      : { label: 'Unassigned', color: '#57534E', background: '#FFFFFF', border: '#E7E5E4' };
                  return (
                    <article
                      key={section.id}
                      id={section.id}
                      style={{
                        border: '1px solid #E7E5E4',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '14px',
                        padding: '14px 16px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => {
                            setOpenSectionIds((prev) => (
                              prev.includes(section.id)
                                ? prev.filter((id) => id !== section.id)
                                : [...prev, section.id]
                            ));
                          }}
                          style={{
                            border: 'none',
                            background: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            flex: '1 1 360px',
                            minWidth: 0,
                            textAlign: 'left',
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#A8A29E', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Section {section.order}
                            </div>
                            <div style={{ fontSize: '17px', fontWeight: 700, color: '#1C1917', lineHeight: 1.25 }}>
                              {section.title}
                            </div>
                            {assigneeMode && assignmentBoardVisible && (
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: frontendOwner?.color ?? '#57534E',
                                    backgroundColor: frontendOwner?.background ?? '#FFFFFF',
                                    border: `1px solid ${frontendOwner?.border ?? '#E7E5E4'}`,
                                    borderRadius: '9999px',
                                    padding: '5px 8px',
                                  }}
                                >
                                  FE {frontendOwner?.label ?? 'Unassigned'}{tracking.frontendDone ? ' - Done' : ''}
                                </span>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: backendOwner?.color ?? '#57534E',
                                    backgroundColor: backendOwner?.background ?? '#FFFFFF',
                                    border: `1px solid ${backendOwner?.border ?? '#E7E5E4'}`,
                                    borderRadius: '9999px',
                                    padding: '5px 8px',
                                  }}
                                >
                                  BE {backendOwner?.label ?? 'Unassigned'}{tracking.backendDone ? ' - Done' : ''}
                                </span>
                                {tracking.sprintTag && (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      color: '#1D4ED8',
                                      backgroundColor: '#EFF6FF',
                                      border: '1px solid #93C5FD',
                                      borderRadius: '9999px',
                                      padding: '5px 8px',
                                    }}
                                  >
                                    {tracking.sprintTag}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {isOpen ? (
                            <ChevronUp style={{ width: '16px', height: '16px', color: '#A8A29E', flexShrink: 0 }} />
                          ) : (
                            <ChevronDown style={{ width: '16px', height: '16px', color: '#A8A29E', flexShrink: 0 }} />
                          )}
                        </button>

                        {assigneeMode ? (
                          <span
                            style={{
                              border: '1px solid',
                              borderColor: packetStatus.border,
                              backgroundColor: packetStatus.background,
                              color: packetStatus.color,
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: 700,
                              padding: '7px 11px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {completed ? <CheckCircle2 style={{ width: '13px', height: '13px' }} /> : <Circle style={{ width: '13px', height: '13px' }} />}
                            {packetStatus.label}
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              updateSectionTracking(section.id, (current) => ({
                                ...current,
                                done: !current.done,
                              }));
                            }}
                            style={{
                              border: '1px solid',
                              borderColor: completed ? '#34D399' : '#E7E5E4',
                              backgroundColor: completed ? '#ECFDF5' : '#FFFFFF',
                              color: completed ? '#047857' : '#57534E',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: 700,
                              padding: '7px 11px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {completed ? <CheckCircle2 style={{ width: '13px', height: '13px' }} /> : <Circle style={{ width: '13px', height: '13px' }} />}
                            {completed ? 'Done' : 'Mark Done'}
                          </button>
                        )}
                      </div>

                      {isOpen && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F0EEEB' }}>
                          {assigneeMode && assignmentBoardVisible && (
                            <div
                              style={{
                                marginBottom: '14px',
                                padding: '14px',
                                border: '1px solid #F0EEEB',
                                backgroundColor: '#FAF8F5',
                                borderRadius: '12px',
                              }}
                            >
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1C1917', marginBottom: '4px' }}>
                                Team Assignment Board
                              </div>
                              <div style={{ fontSize: '12px', color: '#78716C', marginBottom: '12px' }}>
                                Pick one owner for frontend and one owner for backend. Add a sprint tag if you want. These tags persist in Hive’s private tracker, and the packet becomes complete only when both sides are marked done.
                              </div>

                              <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                                  Sprint Tag
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  {DOC_SPRINT_TAGS.map((sprintTag) => {
                                    const selected = tracking.sprintTag === sprintTag;
                                    return (
                                      <button
                                        key={sprintTag}
                                        onClick={() => {
                                          updateSectionTracking(section.id, (current) => ({
                                            ...current,
                                            sprintTag: current.sprintTag === sprintTag ? null : sprintTag,
                                          }));
                                        }}
                                        disabled={assignmentMutationsDisabled}
                                        style={{
                                          border: '1px solid',
                                          borderColor: selected ? '#1D4ED8' : '#93C5FD',
                                          backgroundColor: assignmentMutationsDisabled ? '#F5F5F4' : selected ? '#EFF6FF' : '#FFFFFF',
                                          color: assignmentMutationsDisabled ? '#A8A29E' : '#1D4ED8',
                                          borderRadius: '9999px',
                                          fontSize: '12px',
                                          fontWeight: 700,
                                          padding: '7px 10px',
                                          cursor: assignmentMutationsDisabled ? 'not-allowed' : 'pointer',
                                        }}
                                      >
                                        {sprintTag}
                                      </button>
                                    );
                                  })}
                                  <button
                                    onClick={() => {
                                      updateSectionTracking(section.id, (current) => ({
                                        ...current,
                                        sprintTag: null,
                                      }));
                                    }}
                                    disabled={assignmentMutationsDisabled}
                                    style={{
                                      border: '1px solid #E7E5E4',
                                      backgroundColor: assignmentMutationsDisabled ? '#F5F5F4' : '#FFFFFF',
                                      color: assignmentMutationsDisabled ? '#A8A29E' : '#57534E',
                                      borderRadius: '9999px',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      padding: '7px 10px',
                                      cursor: assignmentMutationsDisabled ? 'not-allowed' : 'pointer',
                                    }}
                                  >
                                    Clear Sprint
                                  </button>
                                </div>
                              </div>

                              <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                                {(['frontend', 'backend'] as const).map((lane) => {
                                  const laneOwner = lane === 'frontend' ? frontendOwner : backendOwner;
                                  const laneOwnerUsername = lane === 'frontend' ? tracking.frontendOwner : tracking.backendOwner;
                                  const laneDone = lane === 'frontend' ? Boolean(tracking.frontendDone) : Boolean(tracking.backendDone);
                                  const laneLabel = lane === 'frontend' ? 'Frontend' : 'Backend';
                                  const ownerKey = lane === 'frontend' ? 'frontendOwner' : 'backendOwner';
                                  const doneKey = lane === 'frontend' ? 'frontendDone' : 'backendDone';

                                  return (
                                    <div
                                      key={lane}
                                      style={{
                                        border: '1px solid #E7E5E4',
                                        backgroundColor: '#FFFFFF',
                                        borderRadius: '12px',
                                        padding: '12px',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                        <div>
                                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                            {laneLabel}
                                          </div>
                                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1C1917', marginTop: '2px' }}>
                                            {laneOwner?.label ?? 'No owner selected'}
                                          </div>
                                        </div>

                                        <button
                                          onClick={() => {
                                            updateSectionTracking(section.id, (current) => ({
                                              ...current,
                                              [doneKey]: !(current[doneKey] === true),
                                            }));
                                          }}
                                          disabled={assignmentMutationsDisabled}
                                          style={{
                                            border: '1px solid',
                                            borderColor: laneDone ? '#34D399' : '#E7E5E4',
                                            backgroundColor: assignmentMutationsDisabled ? '#F5F5F4' : laneDone ? '#ECFDF5' : '#FFFFFF',
                                            color: assignmentMutationsDisabled ? '#A8A29E' : laneDone ? '#047857' : '#57534E',
                                            borderRadius: '9999px',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            padding: '7px 11px',
                                            cursor: assignmentMutationsDisabled ? 'not-allowed' : 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                          }}
                                        >
                                          {laneDone ? <CheckCircle2 style={{ width: '13px', height: '13px' }} /> : <Circle style={{ width: '13px', height: '13px' }} />}
                                          {laneDone ? 'Marked Done' : 'Mark Done'}
                                        </button>
                                      </div>

                                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {assignees.map((assignee) => {
                                          const selected = laneOwnerUsername === assignee.username;
                                          return (
                                            <button
                                              key={assignee.username}
                                              onClick={() => {
                                                updateSectionTracking(section.id, (current) => ({
                                                  ...current,
                                                  [ownerKey]: current[ownerKey] === assignee.username ? null : assignee.username,
                                                }));
                                              }}
                                              disabled={assignmentMutationsDisabled}
                                              style={{
                                                border: '1px solid',
                                                borderColor: selected ? assignee.color : assignee.border,
                                                backgroundColor: assignmentMutationsDisabled ? '#F5F5F4' : selected ? assignee.background : '#FFFFFF',
                                                color: assignmentMutationsDisabled ? '#A8A29E' : assignee.color,
                                                borderRadius: '9999px',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                padding: '7px 10px',
                                                cursor: assignmentMutationsDisabled ? 'not-allowed' : 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                              }}
                                            >
                                              <UserRound style={{ width: '12px', height: '12px' }} />
                                              {assignee.label}
                                            </button>
                                          );
                                        })}

                                        <button
                                          onClick={() => {
                                            updateSectionTracking(section.id, (current) => ({
                                              ...current,
                                              [ownerKey]: null,
                                            }));
                                          }}
                                          disabled={assignmentMutationsDisabled}
                                          style={{
                                            border: '1px solid #E7E5E4',
                                            backgroundColor: assignmentMutationsDisabled ? '#F5F5F4' : '#FFFFFF',
                                            color: assignmentMutationsDisabled ? '#A8A29E' : '#57534E',
                                            borderRadius: '9999px',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            padding: '7px 10px',
                                            cursor: assignmentMutationsDisabled ? 'not-allowed' : 'pointer',
                                          }}
                                        >
                                          Clear
                                        </button>
                                      </div>

                                      <div style={{ fontSize: '12px', color: '#78716C', marginTop: '10px' }}>
                                        {laneOwner
                                          ? `${laneLabel} owner is ${laneOwner.label}.${laneDone ? ' This side is marked complete.' : ' This side is still pending.'}`
                                          : `${laneLabel} is still unassigned.`}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <div className="doc-prose">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={DOC_MARKDOWN_COMPONENTS}>{section.content}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="doc-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={DOC_MARKDOWN_COMPONENTS}>{doc.content}</ReactMarkdown>
          </div>
        )}

        {!isEmbedded && (
          <div style={{ paddingTop: '32px', marginTop: '32px', borderTop: '1px solid #E7E5E4' }}>
            <button
              onClick={() => navigate('/docs')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '14px', color: '#A8A29E', background: 'none',
                border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              <ArrowLeft style={{ width: '16px', height: '16px' }} />
              All Documentation
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default function Docs() {
  const features = useFeatures();
  const { slug } = useParams();
  const navigate = useNavigate();
  const storedAccess = useMemo(() => loadInternalTeamAccess(), []);
  const [teamAccess, setTeamAccess] = useState<InternalTeamAccess | null>(null);
  const [teamAssignees, setTeamAssignees] = useState<DeveloperOption[]>([]);
  const [mirrorGuideTrackingSeed, setMirrorGuideTrackingSeed] = useState<Record<string, unknown> | null>(null);
  const [mirrorGuideTrackingReady, setMirrorGuideTrackingReady] = useState(false);
  const [usernameInput, setUsernameInput] = useState(() => storedAccess?.username ?? '');
  const [serverNameInput, setServerNameInput] = useState(() => storedAccess?.serverName ?? '');
  const [accessError, setAccessError] = useState('');
  const [accessCheckLoading, setAccessCheckLoading] = useState(() => Boolean(storedAccess));

  useEffect(() => {
    if (!storedAccess) {
      setAccessCheckLoading(false);
      return;
    }

    let cancelled = false;
    setAccessCheckLoading(true);

    apiGet<DocsTrackingAccessResponse>('/internal/docs-tracking.php', {
      doc_slug: 'mirror-rebuild-guide',
      username: storedAccess.username,
      server_name: storedAccess.serverName,
    })
      .then((response) => {
        if (cancelled) return;
        const canonicalUsername = typeof response.viewer === 'string' && response.viewer.trim().length > 0
          ? response.viewer.trim()
          : storedAccess.username.trim();
        const nextAccess = {
          username: canonicalUsername,
          serverName: storedAccess.serverName.trim(),
        };
        saveInternalTeamAccess(nextAccess);
        setTeamAccess(nextAccess);
        setUsernameInput(canonicalUsername);
        setTeamAssignees(buildDeveloperOptions(Array.isArray(response.assignees) ? response.assignees : []));
        setMirrorGuideTrackingSeed(response.tracking && typeof response.tracking === 'object' ? response.tracking : {});
        setMirrorGuideTrackingReady(true);
        setAccessError('');
        setAccessCheckLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        saveInternalTeamAccess(null);
        setTeamAccess(null);
        setTeamAssignees([]);
        setMirrorGuideTrackingSeed(null);
        setMirrorGuideTrackingReady(false);
        setAccessCheckLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [storedAccess]);

  if (features.loading) return null;
  if (!features.docs) return <NotFound />;
  if (slug && slug !== OTHER_GUIDES_SLUG && !DOCS[slug]) return <NotFound />;

  const activeTab = getWorkspaceTabForSlug(slug);
  const activeTabMeta = DOC_WORKSPACE_TABS.find((tab) => tab.id === activeTab) ?? DOC_WORKSPACE_TABS[0];
  const activeOtherGuideSlug = activeTab === 'other-guides' && slug && slug !== OTHER_GUIDES_SLUG && DOCS[slug] ? slug : null;
  const selectedOtherGuide = activeOtherGuideSlug ? DOCS[activeOtherGuideSlug] : null;
  const activeAssignee = getAssignee(teamAccess?.username, teamAssignees);

  const unlockWorkspace = () => {
    const attemptedAccess: InternalTeamAccess = {
      username: usernameInput.trim(),
      serverName: serverNameInput.trim(),
    };

    if (!attemptedAccess.username || !attemptedAccess.serverName) {
      setAccessError(explainInternalAccessError(attemptedAccess.username, attemptedAccess.serverName));
      return;
    }

    setAccessCheckLoading(true);
    setAccessError('');

    apiGet<DocsTrackingAccessResponse>('/internal/docs-tracking.php', {
      doc_slug: 'mirror-rebuild-guide',
      username: attemptedAccess.username,
      server_name: attemptedAccess.serverName,
    })
      .then((response) => {
        const canonicalUsername = typeof response.viewer === 'string' && response.viewer.trim().length > 0
          ? response.viewer.trim()
          : attemptedAccess.username;
        const nextAccess = {
          username: canonicalUsername,
          serverName: attemptedAccess.serverName,
        };
        saveInternalTeamAccess(nextAccess);
        setTeamAccess(nextAccess);
        setUsernameInput(canonicalUsername);
        setTeamAssignees(buildDeveloperOptions(Array.isArray(response.assignees) ? response.assignees : []));
        setMirrorGuideTrackingSeed(response.tracking && typeof response.tracking === 'object' ? response.tracking : {});
        setMirrorGuideTrackingReady(true);
        setAccessError('');
        setAccessCheckLoading(false);
        navigate('/docs/mirror-rebuild-guide');
      })
      .catch((error) => {
        setTeamAccess(null);
        setTeamAssignees([]);
        setMirrorGuideTrackingSeed(null);
        setMirrorGuideTrackingReady(false);
        setAccessCheckLoading(false);
        setAccessError(error instanceof ApiError ? error.message : 'Access check failed.');
      });
  };

  const clearAccess = () => {
    saveInternalTeamAccess(null);
    setTeamAccess(null);
    setTeamAssignees([]);
    setMirrorGuideTrackingSeed(null);
    setMirrorGuideTrackingReady(false);
    setUsernameInput('');
    setServerNameInput('');
    setAccessError('');
    setAccessCheckLoading(false);
    navigate('/docs');
  };

  const openWorkspaceTab = (tabId: DocsWorkspaceTabId) => {
    navigate(getWorkspacePathForTab(tabId, activeOtherGuideSlug));
  };

  const activePrimaryDocSlug = activeTab === 'mirror-guide'
    ? 'mirror-rebuild-guide'
    : activeTab === 'tests'
      ? 'feature-test-cases'
      : null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF8F5' }}>
      <NavBar />

      <section style={{ backgroundColor: '#1C1917', paddingTop: '64px', paddingBottom: teamAccess ? '40px' : '72px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 16px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(233,160,32,0.15)',
              marginBottom: '24px',
            }}
          >
            <BookOpen style={{ width: '32px', height: '32px', color: '#E9A020' }} />
          </div>

          <h1
            className="font-display italic"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', color: '#FAF8F5', letterSpacing: '-0.025em', marginBottom: '12px' }}
          >
            Docs Workspace
          </h1>
          <p style={{ color: '#A8A29E', fontSize: '18px', maxWidth: '900px', lineHeight: 1.65, marginBottom: teamAccess ? '0' : '24px' }}>
            Internal workspace.
          </p>

          {!teamAccess && (
            <div
              style={{
                display: 'grid',
                gap: '14px',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                marginTop: '28px',
              }}
            >
              {[
                'Handle',
                'Server',
                'Enter',
              ].map((line) => (
                <div
                  key={line}
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderRadius: '16px',
                    padding: '16px 18px',
                    color: '#D6D3D1',
                    fontSize: '14px',
                    lineHeight: 1.6,
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ maxWidth: '1120px', margin: '0 auto', padding: teamAccess ? '24px 16px 72px' : '32px 16px 72px' }}>
        {!teamAccess ? (
          <div
            style={{
              border: '1px solid #E7E5E4',
              backgroundColor: '#FFFFFF',
              borderRadius: '22px',
              padding: '24px',
              boxShadow: '0 10px 40px rgba(28,25,23,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: '#FFF8EA',
                  color: '#C4850C',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#1C1917' }}>
                  Access Workspace
                </div>
                <div style={{ fontSize: '14px', color: '#78716C', marginTop: '2px' }}>
                  Enter your handle and server name.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginTop: '18px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  GitHub Username
                </span>
                <input
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    setAccessError('');
                  }}
                  placeholder=""
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{
                    width: '100%',
                    border: '1px solid #D6D3D1',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    fontSize: '14px',
                    color: '#1C1917',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Server Name
                </span>
                <input
                  value={serverNameInput}
                  onChange={(e) => {
                    setServerNameInput(e.target.value);
                    setAccessError('');
                  }}
                  placeholder=""
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{
                    width: '100%',
                    border: '1px solid #D6D3D1',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    fontSize: '14px',
                    color: '#1C1917',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                  }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginTop: '18px' }}>
              <div style={{ fontSize: '13px', color: accessError ? '#B91C1C' : '#78716C', lineHeight: 1.6 }}>
                {accessError || 'Enter your handle and server name.'}
              </div>

              <button
                onClick={unlockWorkspace}
                disabled={accessCheckLoading}
                style={{
                  border: 'none',
                  backgroundColor: accessCheckLoading ? '#A8A29E' : '#1C1917',
                  color: '#FAF8F5',
                  borderRadius: '9999px',
                  padding: '12px 18px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: accessCheckLoading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <KeyRound style={{ width: '15px', height: '15px' }} />
                {accessCheckLoading ? 'Checking...' : 'Enter'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                border: '1px solid #E7E5E4',
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                padding: '20px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                    Active Internal Access
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderRadius: '9999px',
                        border: `1px solid ${activeAssignee?.border ?? '#E7E5E4'}`,
                        backgroundColor: activeAssignee?.background ?? '#FFFFFF',
                        color: activeAssignee?.color ?? '#57534E',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '7px 11px',
                      }}
                    >
                      <UserRound style={{ width: '12px', height: '12px' }} />
                      {teamAccess.username}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderRadius: '9999px',
                        border: '1px solid #D6D3D1',
                        backgroundColor: '#FAF8F5',
                        color: '#57534E',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '7px 11px',
                      }}
                    >
                      <ShieldCheck style={{ width: '12px', height: '12px' }} />
                      {teamAccess.serverName}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#78716C', marginTop: '10px', lineHeight: 1.6 }}>
                    Mirror Guide is the shared assignment board. Tests stays reference-only. Other Guides contains the rest of the internal docs library. Typing a GitHub username or sprint tag like
                    {' '}
                    <span style={{ fontWeight: 700, color: '#1C1917' }}>Sprint 2</span>
                    {' '}
                    into the Mirror Guide search bar filters the matching packets.
                  </div>
                </div>

                <button
                  onClick={clearAccess}
                  style={{
                    border: '1px solid #E7E5E4',
                    backgroundColor: '#FFFFFF',
                    color: '#57534E',
                    borderRadius: '9999px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                  }}
                >
                  <LogOut style={{ width: '14px', height: '14px' }} />
                  Switch User
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px' }}>
                {DOC_WORKSPACE_TABS.map((tab) => {
                  const selected = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => openWorkspaceTab(tab.id)}
                      style={{
                        flex: '1 1 240px',
                        minWidth: 0,
                        textAlign: 'left',
                        border: '1px solid',
                        borderColor: selected ? tab.border : '#E7E5E4',
                        backgroundColor: selected ? tab.background : '#FFFFFF',
                        color: selected ? tab.accent : '#57534E',
                        borderRadius: '16px',
                        padding: '14px 16px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '10px',
                            backgroundColor: selected ? '#FFFFFF' : '#FAF8F5',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon style={{ width: '18px', height: '18px' }} />
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 700 }}>
                          {tab.label}
                        </div>
                        {selected && (
                          <CheckCircle2 style={{ width: '16px', height: '16px', marginLeft: 'auto' }} />
                        )}
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: 1.55 }}>
                        {tab.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                border: '1px solid #E7E5E4',
                backgroundColor: '#FFFFFF',
                borderRadius: '22px',
                padding: '18px',
                boxShadow: '0 10px 36px rgba(28,25,23,0.05)',
              }}
            >
              <div style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid #F0EEEB' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: activeTabMeta.accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  {activeTabMeta.label}
                </div>
                <div style={{ fontSize: '14px', color: '#57534E', lineHeight: 1.65 }}>
                  {activeTabMeta.description}
                </div>
              </div>

              {activePrimaryDocSlug ? (
                <DocViewer
                  slug={activePrimaryDocSlug}
                  embedded
                  teamAccess={teamAccess}
                  assignees={teamAssignees}
                  sharedTrackingSeed={activePrimaryDocSlug === 'mirror-rebuild-guide' ? mirrorGuideTrackingSeed : null}
                  sharedTrackingReady={activePrimaryDocSlug === 'mirror-rebuild-guide' ? mirrorGuideTrackingReady : false}
                  onSharedTrackingChange={activePrimaryDocSlug === 'mirror-rebuild-guide' ? setMirrorGuideTrackingSeed : undefined}
                />
              ) : selectedOtherGuide ? (
                <div>
                  <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#1C1917' }}>
                        {selectedOtherGuide.title}
                      </div>
                      <div style={{ fontSize: '14px', color: '#78716C', marginTop: '4px', lineHeight: 1.6 }}>
                        {selectedOtherGuide.description}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/docs/${OTHER_GUIDES_SLUG}`)}
                      style={{
                        border: '1px solid #E7E5E4',
                        backgroundColor: '#FFFFFF',
                        color: '#57534E',
                        borderRadius: '9999px',
                        padding: '9px 13px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <ArrowLeft style={{ width: '13px', height: '13px' }} />
                      All Other Guides
                    </button>
                  </div>

                  <DocViewer
                    slug={activeOtherGuideSlug}
                    embedded
                    teamAccess={teamAccess}
                    assignees={teamAssignees}
                    sharedTrackingSeed={activeOtherGuideSlug === 'mirror-rebuild-guide' ? mirrorGuideTrackingSeed : null}
                    sharedTrackingReady={activeOtherGuideSlug === 'mirror-rebuild-guide' ? mirrorGuideTrackingReady : false}
                    onSharedTrackingChange={activeOtherGuideSlug === 'mirror-rebuild-guide' ? setMirrorGuideTrackingSeed : undefined}
                  />
                </div>
              ) : (
                <OtherGuidesLibrary />
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
