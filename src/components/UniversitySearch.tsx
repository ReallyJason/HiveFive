import { useState, useRef, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { CharacterLimitHint } from './CharacterLimitHint';

// ────────────────────────────────────────────────────────────────
// ~300 prominent US colleges & universities
// Each entry can include aliases after a "|" for matching purposes
// ────────────────────────────────────────────────────────────────
const UNIVERSITIES: { name: string; aliases: string[] }[] = buildList([
  // ── Ivy League ──
  'Harvard University',
  'Yale University',
  'Princeton University',
  'Columbia University',
  'University of Pennsylvania|UPenn|Penn',
  'Brown University',
  'Dartmouth College',
  'Cornell University',

  // ── Top Private ──
  'Stanford University',
  'Massachusetts Institute of Technology (MIT)|MIT',
  'California Institute of Technology (Caltech)|Caltech',
  'Carnegie Mellon University|CMU',
  'Duke University',
  'Northwestern University',
  'University of Notre Dame|Notre Dame',
  'Vanderbilt University',
  'Emory University',
  'Rice University',
  'Washington University in St. Louis|WashU',
  'Georgetown University',
  'Tufts University',
  'New York University (NYU)|NYU',
  'Boston University|BU',
  'Northeastern University',
  'University of Southern California (USC)|USC',
  'Wake Forest University',
  'Lehigh University',
  'Boston College|BC',
  'Villanova University',
  'University of Rochester',
  'Brandeis University',
  'Case Western Reserve University|CWRU',
  'Tulane University',
  'University of Miami',
  'George Washington University|GWU',
  'American University',
  'Syracuse University',
  'University of Denver',
  'Fordham University',
  'Loyola Marymount University|LMU',
  'Santa Clara University',
  'Gonzaga University',
  'Marquette University',
  'Creighton University',
  'Southern Methodist University (SMU)|SMU',
  'Texas Christian University (TCU)|TCU',
  'Pepperdine University',
  'Chapman University',
  'Elon University',
  'Quinnipiac University',
  'Fairfield University',
  'Seton Hall University',
  'University of San Diego',
  'University of San Francisco',
  'DePaul University',
  'Loyola University Chicago',
  'Drexel University',
  'Stevens Institute of Technology|Stevens Tech',
  'Illinois Institute of Technology|IIT',

  // ── UC System ──
  'University of California, Berkeley|UC Berkeley|Cal',
  'University of California, Los Angeles (UCLA)|UCLA',
  'University of California, San Diego (UCSD)|UCSD',
  'University of California, Santa Barbara (UCSB)|UCSB',
  'University of California, Davis|UC Davis',
  'University of California, Irvine|UC Irvine|UCI',
  'University of California, Santa Cruz|UC Santa Cruz|UCSC',
  'University of California, Riverside|UC Riverside|UCR',
  'University of California, Merced|UC Merced',

  // ── SUNY System ──
  'Stony Brook University (SUNY)|Stony Brook|SUNY Stony Brook',
  'University at Buffalo (SUNY)|UB|SUNY Buffalo',
  'Binghamton University (SUNY)|Binghamton|SUNY Binghamton',
  'University at Albany (SUNY)|UAlbany|SUNY Albany',
  'SUNY College at Geneseo|SUNY Geneseo|Geneseo',
  'SUNY Oswego',
  'SUNY Cortland',
  'SUNY Plattsburgh',
  'SUNY New Paltz',
  'SUNY Oneonta',
  'SUNY Fredonia',
  'SUNY Brockport',
  'SUNY Purchase|Purchase College',
  'SUNY Polytechnic Institute|SUNY Poly',
  'Fashion Institute of Technology (SUNY)|FIT',

  // ── CUNY System ──
  'Baruch College (CUNY)|Baruch|CUNY Baruch',
  'Hunter College (CUNY)|Hunter|CUNY Hunter',
  'City College of New York (CUNY)|CCNY|City College',
  'Brooklyn College (CUNY)|Brooklyn College|CUNY Brooklyn',
  'Queens College (CUNY)|Queens College|CUNY Queens',
  'John Jay College of Criminal Justice (CUNY)|John Jay',
  'Lehman College (CUNY)|Lehman|CUNY Lehman',
  'College of Staten Island (CUNY)|CSI|CUNY Staten Island',
  'Macaulay Honors College (CUNY)|Macaulay',
  'York College (CUNY)|CUNY York',
  'Medgar Evers College (CUNY)',

  // ── Major State Flagships & Public Universities ──
  'University of Michigan, Ann Arbor|UMich|Michigan',
  'University of Virginia|UVA',
  'University of North Carolina at Chapel Hill|UNC|Chapel Hill',
  'Georgia Institute of Technology|Georgia Tech|GT',
  'University of Florida|UF',
  'Ohio State University|OSU|Ohio State',
  'Pennsylvania State University|Penn State|PSU',
  'Purdue University',
  'University of Wisconsin-Madison|UW Madison|Wisconsin',
  'University of Illinois Urbana-Champaign|UIUC|Illinois',
  'University of Texas at Austin|UT Austin|Texas',
  'University of Washington|UW|U-Dub',
  'University of Georgia|UGA',
  'University of Maryland, College Park|UMD|Maryland',
  'Texas A&M University|TAMU|Texas A&M',
  'Indiana University Bloomington|IU|Indiana',
  'University of Minnesota Twin Cities|UMN|Minnesota',
  'Michigan State University|MSU',
  'Rutgers University - New Brunswick|Rutgers',
  'University of Iowa',
  'University of Oregon',
  'University of Colorado Boulder|CU Boulder|Colorado',
  'University of Arizona',
  'Arizona State University|ASU',
  'University of Pittsburgh|Pitt',
  'Virginia Tech|VT',
  'North Carolina State University|NC State|NCSU',
  'Clemson University',
  'University of Connecticut|UConn',
  'University of Massachusetts Amherst|UMass Amherst|UMass',
  'University of Tennessee, Knoxville|UTK',
  'University of South Carolina|USC Columbia',
  'University of Kentucky|UK',
  'University of Alabama|Bama|Alabama',
  'Louisiana State University|LSU',
  'University of Oklahoma|OU',
  'University of Kansas|KU',
  'University of Missouri|Mizzou',
  'University of Nebraska-Lincoln|UNL|Nebraska',
  'Iowa State University|ISU',
  'Kansas State University|K-State',
  'Oklahoma State University|OSU Stillwater|OKState',
  'University of Arkansas',
  'University of Mississippi|Ole Miss',
  'Mississippi State University|Miss State',
  'West Virginia University|WVU',
  'University of Utah|U of U',
  'Colorado State University|CSU',
  'Oregon State University|OSU Corvallis',
  'Washington State University|WSU|Wazzu',
  'University of New Mexico|UNM',
  'University of Nevada, Las Vegas (UNLV)|UNLV',
  'University of Nevada, Reno|UNR',
  'University of Hawaii at Manoa|UH Manoa',
  'University of Idaho',
  'University of Montana',
  'University of Wyoming',
  'Montana State University',
  'Boise State University',
  'University of Alaska Fairbanks|UAF',
  'University of North Dakota|UND',
  'University of South Dakota|USD',
  'North Dakota State University|NDSU',
  'South Dakota State University|SDSU Brookings',
  'University of Vermont|UVM',
  'University of New Hampshire|UNH',
  'University of Maine',
  'University of Rhode Island|URI',
  'University of Delaware|UD',
  'University of Louisville',
  'Florida State University|FSU',
  'University of Central Florida|UCF',
  'University of South Florida|USF',
  'Florida International University|FIU',
  'Florida Atlantic University|FAU',
  'George Mason University|GMU',
  'James Madison University|JMU',
  'College of William & Mary|William and Mary|W&M',
  'University of Cincinnati',
  'Temple University',
  'University of Houston|UH',
  'San Diego State University|SDSU',
  'San Jose State University|SJSU',
  'California State University, Long Beach|CSULB|Long Beach State',
  'California State University, Fullerton|CSUF|Cal State Fullerton',
  'California State University, Northridge|CSUN',
  'California Polytechnic State University, San Luis Obispo|Cal Poly SLO|Cal Poly',
  'California State Polytechnic University, Pomona|Cal Poly Pomona|CPP',
  'Sacramento State University|Sac State|CSUS',
  'San Francisco State University|SFSU',
  'Fresno State University|Fresno State',
  'California State University, Los Angeles|Cal State LA|CSULA',
  'University at Buffalo (SUNY)' /* already listed above -- skip duplicate in final */,
  'SUNY College of Environmental Science and Forestry|SUNY ESF|ESF',

  // ── Tech / Engineering Schools ──
  'Rensselaer Polytechnic Institute (RPI)|RPI',
  'Rochester Institute of Technology (RIT)|RIT',
  'Worcester Polytechnic Institute (WPI)|WPI',
  'Rose-Hulman Institute of Technology|Rose-Hulman',
  'Colorado School of Mines|Mines',
  'Georgia Institute of Technology|Georgia Tech' /* already above */,
  'Virginia Polytechnic Institute and State University|Virginia Tech' /* alias already above */,
  'New Jersey Institute of Technology (NJIT)|NJIT',
  'Missouri University of Science and Technology|Missouri S&T',
  'Kettering University',
  'Milwaukee School of Engineering|MSOE',
  'Clarkson University',
  'Michigan Technological University|Michigan Tech',

  // ── HBCUs ──
  'Howard University',
  'Morehouse College',
  'Spelman College',
  'Hampton University',
  'Tuskegee University',
  'Florida A&M University|FAMU',
  'North Carolina A&T State University|NC A&T',
  'Tennessee State University|TSU',
  'Jackson State University',
  'Morgan State University',
  'Delaware State University',
  'Clark Atlanta University',
  'Xavier University of Louisiana|XULA',
  'Prairie View A&M University|PVAMU',
  'Southern University and A&M College|Southern University',
  'Grambling State University',
  'Alabama A&M University|AAMU',
  'Alabama State University',
  'Bethune-Cookman University',
  'Norfolk State University',
  'Winston-Salem State University|WSSU',
  'Fisk University',
  'Dillard University',
  'Bowie State University',
  'Coppin State University',

  // ── Liberal Arts Colleges ──
  'Williams College',
  'Amherst College',
  'Swarthmore College',
  'Wellesley College',
  'Pomona College',
  'Bowdoin College',
  'Middlebury College',
  'Claremont McKenna College|CMC',
  'Carleton College',
  'Haverford College',
  'Colby College',
  'Hamilton College',
  'Wesleyan University',
  'Grinnell College',
  'Davidson College',
  'Washington and Lee University|W&L',
  'Colgate University',
  'Bates College',
  'Barnard College',
  'Oberlin College',
  'Vassar College',
  'Bryn Mawr College',
  'Smith College',
  'Mount Holyoke College',
  'Scripps College',
  'Harvey Mudd College',
  'Reed College',
  'Macalester College',
  'Kenyon College',
  'Bucknell University',
  'Lafayette College',
  'Whitman College',
  'Colorado College',
  'Trinity College (CT)',
  'Connecticut College',
  'Union College (NY)',
  'Dickinson College',
  'Gettysburg College',
  'Denison University',
  'Furman University',
  'Rhodes College',
  'Sewanee: The University of the South|Sewanee',
  'Centre College',
  'St. Olaf College',

  // ── Religious Universities ──
  'Brigham Young University (BYU)|BYU',
  'Brigham Young University-Idaho|BYU-Idaho|BYUI',
  'Liberty University',
  'Baylor University',
  'University of Notre Dame|Notre Dame' /* already above */,
  'Georgetown University' /* already above */,
  'Boston College' /* already above */,
  'Villanova University' /* already above */,
  'Santa Clara University' /* already above */,
  'Gonzaga University' /* already above */,
  'Loyola University Maryland',
  'Saint Louis University|SLU',
  'University of Dayton',
  'University of Portland',
  'University of Scranton',
  'Providence College',
  'Abilene Christian University|ACU',
  'Azusa Pacific University|APU',
  'Wheaton College (IL)',
  'Calvin University',
  'Oral Roberts University|ORU',
  'Samford University',
  'Belmont University',
  'Pepperdine University' /* already above */,

  // ── Military Academies ──
  'United States Military Academy (West Point)|West Point|USMA',
  'United States Naval Academy|Naval Academy|USNA|Annapolis',
  'United States Air Force Academy|Air Force Academy|USAFA',
  'United States Coast Guard Academy|Coast Guard Academy|USCGA',
  'United States Merchant Marine Academy|Merchant Marine Academy|USMMA',

  // ── Additional Notable Schools ──
  'University of Tulsa',
  'Hofstra University',
  'Ithaca College',
  'Marist College',
  'Pace University',
  'Long Island University|LIU',
  'St. John\'s University (NY)|St. Johns',
  'University of Scranton',
  'University of Hartford',
  'University of Bridgeport',
  'Sacred Heart University',
  'Stonehill College',
  'College of the Holy Cross|Holy Cross',
  'Worcester State University',
  'Embry-Riddle Aeronautical University|ERAU|Embry-Riddle',
  'Full Sail University',
  'Savannah College of Art and Design (SCAD)|SCAD',
  'Rhode Island School of Design (RISD)|RISD',
  'Pratt Institute',
  'Parsons School of Design|Parsons|The New School',
  'School of Visual Arts (SVA)|SVA',
  'Cooper Union|The Cooper Union',
  'Babson College',
  'Bentley University',
  'Bryant University',
  'Rollins College',
  'Stetson University',
  'Mercer University',
  'University of Dayton' /* already above */,
  'Butler University',
  'Valparaiso University',
  'Drake University',
  'University of the Pacific',
  'University of Puget Sound',
  'Lewis & Clark College',
  'Willamette University',
  'Seattle University',
  'Pacific Lutheran University',
  'Whitworth University',
  'University of Redlands',
  'Occidental College',
  'Loyola University New Orleans',
  'Tulane University' /* already above */,
  'Auburn University',
  'University of Alabama at Birmingham|UAB',
  'University of South Alabama',
  'Georgia State University|GSU',
  'Kennesaw State University|KSU',
  'Old Dominion University|ODU',
  'Radford University',
  'Appalachian State University|App State',
  'East Carolina University|ECU',
  'University of North Carolina at Charlotte|UNC Charlotte|UNCC',
  'University of North Carolina at Wilmington|UNCW',
  'University of North Carolina at Greensboro|UNCG',
  'Coastal Carolina University|CCU',
  'Wofford College',
  'University of Wyoming' /* already above */,
  'Northern Arizona University|NAU',
  'University of New Orleans|UNO',
  'Portland State University|PSU Portland',
  'Western Washington University|WWU',
  'Central Washington University|CWU',
  'Eastern Washington University|EWU',
  'New Mexico State University|NMSU',
  'University of Texas at Dallas|UT Dallas|UTD',
  'University of Texas at San Antonio|UTSA',
  'University of Texas at Arlington|UTA',
  'University of Texas at El Paso|UTEP',
  'Texas State University|TXST',
  'Texas Tech University|TTU',
  'University of North Texas|UNT',
  'Sam Houston State University|SHSU',
  'Stephen F. Austin State University|SFA',
  'Lamar University',
  'Wichita State University|WSU Wichita',
  'Ball State University',
  'Bowling Green State University|BGSU',
  'Wright State University',
  'Youngstown State University|YSU',
  'University of Akron',
  'Kent State University',
  'Miami University (Ohio)|Miami OH',
  'Ohio University|OU Athens',
  'University of Toledo',
  'Cleveland State University',
  'Northern Illinois University|NIU',
  'Southern Illinois University Carbondale|SIU|SIUC',
  'Western Illinois University|WIU',
  'Eastern Illinois University|EIU',
  'Illinois State University|ISU Normal',
  'University of Illinois Chicago (UIC)|UIC',
  'Loyola University Chicago' /* already above */,
]);

/** Parse "Name|alias1|alias2" into {name, aliases} and deduplicate by name */
function buildList(raw: string[]): { name: string; aliases: string[] }[] {
  const seen = new Set<string>();
  const result: { name: string; aliases: string[] }[] = [];
  for (const entry of raw) {
    const parts = entry.split('|');
    const name = parts[0].trim();
    if (seen.has(name)) continue;
    seen.add(name);
    const aliases = parts.slice(1).map((a) => a.trim().toLowerCase());
    result.push({ name, aliases });
  }
  // Sort alphabetically by name
  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

// ────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────

interface UniversitySearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function UniversitySearch({
  value,
  onChange,
  placeholder = 'Search for your university...',
  disabled = false,
}: UniversitySearchProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Keep local query in sync when value is set externally
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter universities based on query
  const getFilteredResults = useCallback(
    (q: string) => {
      if (!q.trim()) return [];
      const lower = q.toLowerCase().trim();
      return UNIVERSITIES.filter(
        (u) =>
          u.name.toLowerCase().includes(lower) ||
          u.aliases.some((a) => a.includes(lower))
      ).slice(0, 8);
    },
    []
  );

  const filtered = getFilteredResults(query);
  const exactMatch = UNIVERSITIES.some(
    (u) => u.name.toLowerCase() === query.toLowerCase().trim()
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('li');
      items[highlightIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  const selectValue = (name: string) => {
    setQuery(name);
    onChange(name);
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setIsOpen(true);
    setHighlightIndex(-1);
  };

  const totalItems = filtered.length + (query.trim() && !exactMatch ? 1 : 0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((prev) => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((prev) => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < filtered.length) {
          selectValue(filtered[highlightIndex].name);
        } else if (highlightIndex === filtered.length && query.trim() && !exactMatch) {
          // Custom option
          selectValue(query.trim());
        } else if (query.trim()) {
          // Just press enter with text -- accept as custom
          selectValue(query.trim());
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <div className="relative" ref={containerRef}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { if (query.trim()) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          className="w-full h-11 pl-10 pr-4 rounded-lg border border-charcoal-100 bg-cream-50 font-sans text-sm text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:outline-none focus:ring-2 focus:ring-honey-500"
          placeholder={placeholder}
          maxLength={100}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-haspopup="listbox"
        />
        <CharacterLimitHint current={query.length} max={100} />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 w-full mt-1.5 bg-white border border-charcoal-100 rounded-xl shadow-2xl p-1.5 max-h-72 overflow-y-auto scrollbar-hide"
        >
          {filtered.map((uni, idx) => (
            <li
              key={uni.name}
              role="option"
              aria-selected={highlightIndex === idx}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click registers
                selectValue(uni.name);
              }}
              onMouseEnter={() => setHighlightIndex(idx)}
              className={`px-3.5 py-2.5 rounded-lg cursor-pointer transition-colors text-sm font-sans ${
                highlightIndex === idx
                  ? 'bg-honey-100 text-charcoal-900'
                  : 'text-charcoal-700 hover:bg-honey-50'
              }`}
            >
              {uni.name}
            </li>
          ))}

          {/* Custom / fallback option */}
          {query.trim() && !exactMatch && (
            <li
              role="option"
              aria-selected={highlightIndex === filtered.length}
              onMouseDown={(e) => {
                e.preventDefault();
                selectValue(query.trim());
              }}
              onMouseEnter={() => setHighlightIndex(filtered.length)}
              className={`px-3.5 py-2.5 rounded-lg cursor-pointer transition-colors text-sm font-sans ${
                highlightIndex === filtered.length
                  ? 'bg-honey-100 text-charcoal-900'
                  : 'text-charcoal-700 hover:bg-honey-50'
              }`}
            >
              Use &lsquo;<span className="font-medium">{query.trim()}</span>&rsquo; as your university
            </li>
          )}

          {filtered.length === 0 && exactMatch && null}
        </ul>
      )}
    </div>
  );
}
