import { Link, useNavigate } from 'react-router';
import { NavBar } from '../components/NavBar';
import { useAuth } from '../lib/auth';
import NotFound from './NotFound';
import { Handshake, ArrowLeft } from 'lucide-react';

export default function TeamAgreement() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;
  if (!user || user.role !== 'admin') return <NotFound />;

  const effectiveDate = 'February 18, 2026';

  const sectionStyle = { marginBottom: '32px' } as const;
  const headingStyle = { fontSize: '24px', color: '#1C1917', marginBottom: '12px' } as const;
  const bodyStyle = { color: '#57534E', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '12px' } as const;
  const listStyle = { paddingLeft: '20px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '6px' } as const;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF8F5' }}>
      <NavBar />

      {/* Hero */}
      <section style={{ backgroundColor: '#1C1917', paddingTop: '64px', paddingBottom: '96px' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '0 16px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: 'rgba(233,160,32,0.15)', marginBottom: '24px',
            }}
          >
            <Handshake style={{ width: '32px', height: '32px', color: '#E9A020' }} />
          </div>
          <h1
            className="font-display italic"
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#FAF8F5', letterSpacing: '-0.025em', marginBottom: '16px' }}
          >
            Team Agreement
          </h1>
          <p style={{ color: '#78756E', fontSize: '18px' }}>
            Internal IP &amp; ownership terms for the HiveFive team. Last updated {effectiveDate}.
          </p>
        </div>
      </section>

      {/* Content */}
      <section style={{ maxWidth: '768px', margin: '0 auto', padding: '48px 16px 64px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

          {/* Preamble */}
          <div style={{ borderRadius: '8px', padding: '24px', backgroundColor: 'rgba(233,160,32,0.08)', border: '1px solid rgba(233,160,32,0.2)' }}>
            <p style={{ color: '#57534E', lineHeight: 1.7 }}>
              This agreement governs intellectual property ownership and creative rights among members of the HiveFive development team. By accessing or contributing to HiveFive in any capacity — including but not limited to development, design, testing, deployment, or administration — you agree to be bound by the terms below. This agreement is incorporated by reference into the <Link to="/terms" style={{ color: '#E9A020', textDecoration: 'underline' }}>Terms of Service</Link>.
            </p>
          </div>

          {/* 1 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>1. Creative Contribution &amp; Ownership</h2>
            <div style={bodyStyle}>
              <p>
                Rights within HiveFive follow <strong>creative contribution to the final implemented product</strong>. Each team member's stake in the project is proportional to and defined by the original work they individually conceived, directed, designed, and integrated into the <strong>production version</strong> of the platform.
              </p>
              <p>
                "Creative contribution" means exercising creative judgment over the final implemented expression of a work — including system architecture, production code, implemented feature design, deployed data models, the live user experience, and overall technical and creative direction of the shipped product.
              </p>
              <p>The following do <strong>not</strong> constitute creative contribution for purposes of ownership:</p>
              <ul style={listStyle}>
                <li>Participating in brainstorming or ideation sessions</li>
                <li>Suggesting features or concepts</li>
                <li>Modifying shared wireframes or design boards</li>
                <li>Providing feedback or critique</li>
                <li>Completing assigned project management tasks</li>
                <li>Contributing to presentations or documentation</li>
                <li>Any other activity that did not result in work substantively incorporated into the final production codebase or deployed design system</li>
              </ul>
            </div>
          </div>

          {/* 2 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>2. Final Implemented Expression</h2>
            <div style={bodyStyle}>
              <p>
                Creative rights attach to the <strong>final, implemented expression</strong> of the platform — the deployed code, the production design system, the live user interface, and the functioning product as experienced by end users.
              </p>
              <p>
                Preliminary materials created during the development process — including but not limited to wireframes, mockups, design board revisions, brainstorming notes, presentation materials, project proposals, feature suggestions, and intermediate design artifacts — are working documents and <strong>do not independently establish creative ownership</strong> over the implemented platform.
              </p>
              <p>
                Where preliminary designs or mockups were created or modified by one party but the final implemented expression was independently conceived, directed, and produced by another, creative rights follow the final implementation, not the preliminary materials. Contributions to shared design documents, collaborative boards, or project management tools do not transfer or create co-authorship rights over the final implemented work unless those specific contributions were substantively incorporated into the production version in their original form.
              </p>
            </div>
          </div>

          {/* 3 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>3. Determination of Authorship</h2>
            <div style={bodyStyle}>
              <p>
                In collaborative software development, multiple team members may interact with the same codebase through various roles — including original creation, code review, integration, testing, deployment, and distribution. For purposes of intellectual property ownership, <strong>authorship is determined by original creation, not by subsequent handling</strong>.
              </p>
              <p>The following do <strong>not</strong> establish authorship or creative ownership:</p>
              <ul style={listStyle}>
                <li>Committing code to a version control repository</li>
                <li>Pushing to a remote branch</li>
                <li>Deploying to a server</li>
                <li>Running tests</li>
                <li>Performing code review</li>
                <li>Otherwise handling work that was originally created by another team member</li>
              </ul>
              <p>
                Similarly, transcribing, adapting, reformatting, porting, or re-implementing work that was originally conceived and created by another team member does not constitute independent authorship — it is a <strong>derivative activity</strong>.
              </p>
              <p>
                Where multiple records of the same or substantially similar work exist, authorship is attributable to the <strong>earliest verifiable record of the work's original creation</strong>, as evidenced by version control history, timestamps, development logs, or other contemporaneous documentation, regardless of which repository, branch, or environment the work subsequently appears in.
              </p>
            </div>
          </div>

          {/* 4 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>4. Creation Tools &amp; AI-Assisted Development</h2>
            <div style={bodyStyle}>
              <p>
                HiveFive was built using a variety of development tools and technologies, including but not limited to code editors, frameworks, libraries, AI-assisted development tools, design software, and other productivity aids.
              </p>
              <p>
                The use of any such tools does not diminish or transfer the creative rights of the team members who <strong>conceived, directed, designed, selected, arranged, reviewed, and integrated</strong> the platform's components. The person who exercises creative control over a work's expression — including its architecture, design decisions, feature selection, data modeling, user experience, and overall direction — is the author of that work, regardless of the tools or technologies employed in its production.
              </p>
              <p>
                This is consistent with established intellectual property principles in which the creative director of a work, not the instrument used to produce it, holds authorship rights.
              </p>
            </div>
          </div>

          {/* 5 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>5. Commercialization &amp; Disposition</h2>
            <div style={bodyStyle}>
              <p>
                Decisions regarding the commercialization, licensing, sale, or disposition of the platform and its intellectual property may be made by the team member(s) who hold creative authorship over the relevant components.
              </p>
              <p>
                No team member acquires rights to components they did not originally create or direct the original creation of. A team member who departs the project retains no operational control and no claim to revenue, equity, or proprietary rights derived from components originally created by other team members.
              </p>
              <p>
                Where the platform's value derives from the integrated whole rather than individual components, rights to the integrated work belong to the team member(s) who directed and controlled the overall integration, architecture, and creative vision of the platform.
              </p>
            </div>
          </div>

          {/* 6 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>6. Trade Secrets &amp; Confidentiality</h2>
            <div style={bodyStyle}>
              <p>
                The platform's non-public source code, proprietary business logic, system architecture, database design, internal algorithms, deployment configurations, and operational processes constitute <strong>trade secrets</strong> of the HiveFive team, protected under applicable trade secret law (including the Defend Trade Secrets Act of 2016 and New York's adoption of the Uniform Trade Secrets Act).
              </p>
              <p>
                All team members agree to maintain the confidentiality of these trade secrets during and after their involvement with the project.
              </p>
            </div>
          </div>

          {/* 7 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>7. Survivability</h2>
            <p style={{ color: '#57534E', lineHeight: 1.7 }}>
              This agreement survives the conclusion of any academic course, the dissolution of the team, or any team member's departure from the project. All provisions apply <strong>in perpetuity</strong>.
            </p>
          </div>

        </div>

        {/* Back link */}
        <div style={{ paddingTop: '32px', marginTop: '32px', borderTop: '1px solid #E7E5E4' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#A8A29E', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Go Back
          </button>
        </div>
      </section>
    </div>
  );
}
