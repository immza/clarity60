/**
 * Starter text for the standard pages. Seeded once; after that they are edited in
 * Admin → Pages. Privacy, Cookies and Terms are templates: have them reviewed before
 * the site earns money.
 */
type Node = Record<string, unknown>

const text = (t: string, format = 0): Node => ({ type: 'text', text: t, version: 1, format, mode: 'normal', style: '', detail: 0 })
const p = (...children: (string | Node)[]): Node => ({
  type: 'paragraph',
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  textFormat: 0,
  children: children.map((c) => (typeof c === 'string' ? text(c) : c)),
})
const h2 = (t: string): Node => ({ type: 'heading', tag: 'h2', version: 1, format: '', indent: 0, direction: 'ltr', children: [text(t)] })
const ul = (...items: string[]): Node => ({
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  start: 1,
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  children: items.map((t, i) => ({ type: 'listitem', value: i + 1, version: 1, format: '', indent: 0, direction: 'ltr', children: [text(t)] })),
})
const bold = (t: string) => text(t, 1)
const doc = (...children: Node[]) => ({ root: { type: 'root', version: 1, format: '', indent: 0, direction: 'ltr', children } })

const EMAIL = 'hello@clarity60.com'

export const PAGE_TEMPLATES: { slug: string; title: string; description: string; body: ReturnType<typeof doc> }[] = [
  {
    slug: 'about',
    title: 'About Clarity60',
    description: 'Who we are, what we publish and the standards we hold ourselves to.',
    body: doc(
      p('Clarity60 explains the world in plain English. We publish two kinds of stories: world news that tells you what happened, where, and why it matters, and explainers that give you the backstory behind it.'),
      h2('Our standards'),
      ul(
        'Every story names its sources.',
        'Every article carries a byline and the date it was published and last updated.',
        'We correct mistakes openly. Corrections appear on the story and on our corrections page.',
        'Paid content is always labelled "Sponsored", and affiliate links are disclosed on the page.',
        'We use AI tools for research and planning, but people write, check and publish every story.',
      ),
      h2('Contact'),
      p(`Tips, corrections and questions: ${EMAIL}. Follow the 60-second versions on Instagram at @theclarity60.`),
    ),
  },
  {
    slug: 'contact',
    title: 'Contact',
    description: 'How to reach the Clarity60 newsroom.',
    body: doc(
      p(bold('Email: '), EMAIL),
      p('Spotted a mistake? Tell us what is wrong and where, and we will check it and publish a correction if needed.'),
      p('Advertising and partnerships: see our Advertise page.'),
      p('Instagram: @theclarity60'),
    ),
  },
  {
    slug: 'advertise',
    title: 'Advertise with Clarity60',
    description: 'Vintage-style placements for modern brands.',
    body: doc(
      p('Clarity60 readers are curious people who want to understand the world. We offer a small number of tasteful placements, styled like a vintage print ad, never pop-ups.'),
      h2('What we offer'),
      ul(
        'Display placements on the front page, section pages and articles.',
        'Sponsored explainers, clearly labelled as paid partnerships.',
        'Instagram partnerships with @theclarity60.',
      ),
      p(`Ask for the media kit: ${EMAIL}`),
    ),
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    description: 'What personal data Clarity60 collects, why, and your rights.',
    body: doc(
      p(bold('Template. Review with a lawyer before monetising. '), 'Last updated: [date].'),
      h2('Who we are'),
      p(`Clarity60 ("we") runs clarity60.com. Contact: ${EMAIL}. [Add the legal name and address of the business.]`),
      h2('What we collect'),
      ul(
        'Analytics: with your consent, Google Analytics records pages visited, approximate location, device and browser. IP addresses are anonymised.',
        'Advertising: if ads are shown, Google and other ad partners may use cookies, with your consent where the law requires it.',
        'Accounts (when sign-in launches): your email, name and the provider you sign in with (Google, Facebook or Apple), plus comments and saved articles.',
        'Emails you send us.',
      ),
      h2('Why and on what legal basis'),
      ul(
        'To run and secure the site (legitimate interests).',
        'To measure readership and improve stories (consent).',
        'To show advertising that funds the site (consent).',
        'To operate your account and comments (contract).',
      ),
      h2('Who we share it with'),
      p('Service providers that run the site for us: hosting (DigitalOcean, Cloudflare), database and sign-in (Supabase), images (ImageKit), error monitoring (Sentry), analytics and ads (Google), email (Resend). We do not sell personal data.'),
      h2('Your rights'),
      p(`Depending on where you live (for example under the UK or EU GDPR, or California law), you can ask to access, correct, delete or export your data, and object to or withdraw consent at any time. Email ${EMAIL}. You can also complain to your data protection authority.`),
      h2('Cookies'),
      p('See our Cookie Policy. You can change your choice at any time with "Cookie settings" at the bottom of every page.'),
      h2('Retention'),
      p('Analytics data is kept for 14 months. Account data is kept until you delete your account. Emails are kept as long as needed to answer them.'),
    ),
  },
  {
    slug: 'cookies',
    title: 'Cookie Policy',
    description: 'The cookies Clarity60 uses and how to control them.',
    body: doc(
      p(bold('Template. Review with a lawyer before monetising.')),
      h2('Essential (always on)'),
      ul(
        'c60-theme: remembers Morning or Night Edition. Stored in your browser only.',
        'c60-consent: remembers your cookie choice.',
        'Security cookies set by Cloudflare to protect the site from abuse.',
      ),
      h2('Analytics (only with consent)'),
      ul('Google Analytics (_ga, _ga_*): counts readers and pages. Up to 14 months.'),
      h2('Advertising (only with consent)'),
      ul('Google AdSense and partners may set cookies to show and measure ads, once ads are switched on.'),
      h2('Your choice'),
      p('Use "Cookie settings" at the bottom of any page to change your choice. You can also block cookies in your browser settings.'),
    ),
  },
  {
    slug: 'terms',
    title: 'Terms of Use',
    description: 'The terms for using clarity60.com.',
    body: doc(
      p(bold('Template. Review with a lawyer before monetising.')),
      h2('Using our content'),
      p('You may read, share links to and quote short extracts from our stories with attribution and a link. Republishing whole articles needs written permission.'),
      h2('Accuracy'),
      p('We work hard to be accurate and correct mistakes openly, but stories are for general information, not professional advice.'),
      h2('Links, ads and affiliates'),
      p('We are not responsible for other websites. Some links are affiliate links; we may earn a commission, and we say so on the page.'),
      h2('Comments (when available)'),
      p('Be civil. No spam, hate, harassment or illegal content. We may remove comments and suspend accounts that break these rules.'),
      h2('Contact'),
      p(`Questions about these terms: ${EMAIL}.`),
    ),
  },
]
