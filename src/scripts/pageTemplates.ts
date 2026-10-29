/**
 * Standard pages (About, Editorial Standards, Contact, Advertise, Disclosure, Privacy,
 * Cookies, Terms). Seeded into a new database; after that they are edited in
 * Admin → Pages. Built to cover Google's publisher requirements (AdSense, Analytics,
 * Google News transparency) and the main privacy laws (EU/UK GDPR, ePrivacy, US state
 * laws incl. California, COPPA). Have a lawyer review once before monetising.
 *
 * Fill in PUBLISHER below before launch: these values appear across the legal pages.
 */
export const PUBLISHER = {
  /** Legal name of the person or company that owns Clarity60. */
  legalName: '[PUBLISHER LEGAL NAME]',
  /** Country whose law governs the Terms, e.g. "Bangladesh" or "England and Wales". */
  governingLaw: '[COUNTRY / JURISDICTION]',
  /** Postal address for legal and privacy notices (a business or PO address is fine). */
  address: '[POSTAL ADDRESS]',
  email: 'hello@clarity60.com',
  effectiveDate: '[EFFECTIVE DATE]',
}

type Node = Record<string, unknown>
type Inline = string | Node

const text = (t: string, format = 0): Node => ({ type: 'text', text: t, version: 1, format, mode: 'normal', style: '', detail: 0 })
const inline = (c: Inline) => (typeof c === 'string' ? text(c) : c)
const p = (...children: Inline[]): Node => ({
  type: 'paragraph',
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  textFormat: 0,
  children: children.map(inline),
})
const heading = (tag: 'h2' | 'h3', t: string): Node => ({ type: 'heading', tag, version: 1, format: '', indent: 0, direction: 'ltr', children: [text(t)] })
const h2 = (t: string) => heading('h2', t)
const h3 = (t: string) => heading('h3', t)
/** List items may mix text and links: pass a string or an array of pieces. */
const ul = (...items: (Inline | Inline[])[]): Node => ({
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  start: 1,
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  children: items.map((item, i) => ({
    type: 'listitem',
    value: i + 1,
    version: 1,
    format: '',
    indent: 0,
    direction: 'ltr',
    children: (Array.isArray(item) ? item : [item]).map(inline),
  })),
})
const bold = (t: string) => text(t, 1)
const a = (label: string, url: string): Node => ({
  type: 'link',
  version: 3,
  format: '',
  indent: 0,
  direction: 'ltr',
  fields: { url, newTab: /^https?:/.test(url), linkType: 'custom' },
  children: [text(label)],
})
const doc = (...children: Node[]) => ({ root: { type: 'root', version: 1, format: '', indent: 0, direction: 'ltr', children } })

const { legalName, governingLaw, address, email, effectiveDate } = PUBLISHER
const mail = a(email, `mailto:${email}`)
const updated = p(bold('Last updated: '), effectiveDate)

export type PageTemplate = { slug: string; title: string; description: string; body: ReturnType<typeof doc> }

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    slug: 'about',
    title: 'About Clarity60',
    description: 'Who publishes Clarity60, what we cover, how we are funded and the standards we hold ourselves to.',
    body: doc(
      p('Clarity60 explains the world in plain English. We publish two kinds of stories: world news that tells you what happened, where and why it matters, and explainers that give you the backstory behind it.'),
      h2('Who we are'),
      p(`Clarity60 is published by ${legalName}. We are independent: no government, political party or company owns or directs our journalism.`),
      h2('How we are funded'),
      p('Clarity60 is free to read. We are funded by advertising, affiliate commissions and clearly labelled sponsored content. Advertisers never decide what we cover or what we say. ', a('How advertising works on Clarity60', '/advertising-disclosure'), '.'),
      h2('Our standards'),
      ul(
        'Every story names its sources.',
        'Every article carries a byline and the date it was published and last updated.',
        ['We correct mistakes openly, on the story itself and in our ', a('corrections log', '/corrections'), '.'],
        'Paid content is always labelled "Sponsored", and affiliate links are disclosed on the page.',
        'People write, check and publish every story. AI tools may help with research and planning, never as a substitute for a writer or editor.',
      ),
      p('Read our full ', a('Editorial Standards', '/editorial-standards'), '.'),
      h2('Contact'),
      p('Tips, corrections and questions: ', mail, '. On Instagram: ', a('@theclarity60', 'https://www.instagram.com/theclarity60/'), '.'),
    ),
  },
  {
    slug: 'editorial-standards',
    title: 'Editorial Standards',
    description: 'How Clarity60 reports, sources, corrects and separates journalism from advertising.',
    body: doc(
      updated,
      p('These standards apply to everything we publish. They exist so you can trust what you read, and so you can hold us to account when we fall short.'),
      h2('Accuracy and sourcing'),
      ul(
        'We verify facts before publishing and prefer primary sources: official documents, data, direct statements and on-the-record interviews.',
        'Stories list their sources. Where a claim rests on a single source, we say so.',
        'We distinguish clearly between what is known, what is claimed and what is our analysis.',
        'Developing stories are marked "Developing" and updated with timestamps as facts change.',
      ),
      h2('Corrections'),
      p('When we get something wrong, we fix it promptly and say so. Significant errors get a dated correction note on the story and an entry in our ', a('public corrections log', '/corrections'), '. We do not quietly change facts. To report an error, email ', mail, ' with the story link and what is wrong.'),
      h2('Independence and conflicts of interest'),
      ul(
        'Advertisers, sponsors and affiliate partners have no say over our editorial coverage.',
        'Writers disclose any personal or financial interest in a subject, and are not assigned stories where a conflict exists.',
        'We do not accept payment in exchange for favourable coverage.',
      ),
      h2('Advertising, sponsorship and affiliates'),
      p('Ads are labelled "Advertisement". Paid content is labelled "Sponsored · Paid partnership with [brand]" and is excluded from news listings submitted to Google News. Articles containing affiliate links say so at the top. Details: ', a('Advertising & Affiliate Disclosure', '/advertising-disclosure'), '.'),
      h2('Use of AI'),
      p('We may use AI tools for research, summarising documents, transcription and planning. A person writes, fact-checks and approves every story, and is accountable for it. We do not publish AI-generated articles, and we do not use AI-generated images to depict real people or real news events.'),
      h2('Images'),
      p('Every image carries a credit. We use our own work, licensed images and openly licensed material with attribution. Illustrations are labelled as such.'),
      h2('Bylines and dates'),
      p('Articles show who wrote them and when they were published and last updated. Author pages describe each writer’s background and expertise.'),
      h2('Comments (when available)'),
      p('Comments are moderated. We remove spam, harassment, hate speech, personal information and illegal content.'),
    ),
  },
  {
    slug: 'contact',
    title: 'Contact',
    description: 'How to reach Clarity60 for tips, corrections, privacy requests, legal notices and advertising.',
    body: doc(
      p(bold('Email: '), mail),
      ul(
        [bold('Corrections: '), 'send the story link and what is wrong. See our ', a('Editorial Standards', '/editorial-standards'), '.'],
        [bold('Privacy requests: '), 'access, correction, deletion or opt-out. See our ', a('Privacy Policy', '/privacy'), '.'],
        [bold('Copyright and legal notices: '), `email us, or write to ${legalName}, ${address}.`],
        [bold('Advertising and partnerships: '), a('Advertise with Clarity60', '/advertise'), '.'],
      ),
      p('Instagram: ', a('@theclarity60', 'https://www.instagram.com/theclarity60/')),
    ),
  },
  {
    slug: 'advertise',
    title: 'Advertise with Clarity60',
    description: 'Vintage-style placements for modern brands, always clearly labelled.',
    body: doc(
      p('Clarity60 readers are curious people who want to understand the world. We offer a small number of tasteful placements, styled like a vintage print ad. Never pop-ups.'),
      h2('What we offer'),
      ul(
        'Display placements on the front page, section pages and articles.',
        'Sponsored explainers, clearly labelled as paid partnerships.',
        'Instagram partnerships with @theclarity60.',
      ),
      h2('Our rules'),
      ul(
        'All paid placements are labelled. Sponsors do not review or approve our journalism.',
        'We do not accept ads for illegal products, scams, adult content, or misleading health or financial claims.',
      ),
      p('Ask for the media kit: ', mail),
    ),
  },
  {
    slug: 'advertising-disclosure',
    title: 'Advertising & Affiliate Disclosure',
    description: 'How Clarity60 earns money from ads, affiliate links and sponsored content, and how each is labelled.',
    body: doc(
      updated,
      p('Clarity60 is free to read because of advertising, affiliate commissions and sponsored content. Here is how each works and how you can recognise it.'),
      h2('Advertising'),
      p('Ads are shown in fixed, labelled spaces marked "Advertisement". Some are served by Google AdSense and its partners, which may use cookies to personalise ads where you have allowed it (see our ', a('Cookie Policy', '/cookies'), '). Others are sold directly to brands. Ads never appear inside headlines or disguised as stories.'),
      h2('Affiliate links'),
      p('Some articles, mostly how-tos and recommendations, link to products. If you buy through those links, we may earn a commission at no extra cost to you. Articles containing affiliate links say so at the top. Affiliate links pass through clarity60.com/go/ and are marked as sponsored for search engines. Commissions never decide what we recommend: we recommend things because we think they are useful, and we say when something has drawbacks.'),
      h2('Sponsored content'),
      p('When a brand pays for a story, it is labelled "Sponsored · Paid partnership with [brand]" at the top, its links are marked as sponsored, and it is kept out of the news listings we submit to Google News. Sponsors may suggest a topic; they do not get to approve or edit our conclusions.'),
      h2('Questions'),
      p('Email ', mail, '.'),
    ),
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    description: 'What personal data Clarity60 collects, why, who we share it with, and your rights.',
    body: doc(
      updated,
      p('This policy explains what personal data we collect when you use clarity60.com, why we collect it, who we share it with and the choices and rights you have. We collect as little as we need.'),

      h2('1. Who is responsible'),
      p(`The controller of your personal data is ${legalName}, ${address} ("Clarity60", "we", "us"). Contact: `, mail, '.'),

      h2('2. What we collect'),
      h3('When you read the site'),
      ul(
        'Technical data your browser sends: IP address, device and browser type, language, pages viewed, referring site and time of visit. Our hosting and security providers process this to deliver pages and block attacks.',
        'Your theme choice (Morning or Night Edition) and your cookie choice, stored in your own browser.',
        'If you allow analytics: how you use the site, collected by Google Analytics (see section 4).',
        'If you allow advertising cookies: data used by Google and its partners to show and measure ads (see section 5).',
        'If something breaks: technical error reports (browser type and the error), without your name, cookies or IP address.',
      ),
      h3('When you contact us'),
      p('Your email address, name if you give it, and the content of your message.'),
      h3('When accounts and comments are available'),
      p('If you create an account, we will receive your name, email address and profile picture from the provider you sign in with (Google, Facebook or Apple), and store the comments you post and the articles you save. This section will be updated when accounts launch.'),

      h2('3. Why we use it, and our legal basis'),
      ul(
        [bold('Delivering and securing the site'), ' (technical data, security cookies): our legitimate interest in running a safe, working website.'],
        [bold('Analytics'), ': your consent, where the law requires it.'],
        [bold('Advertising'), ' that funds the site: your consent, where the law requires it. Without consent, any ads shown are non-personalised.'],
        [bold('Answering your messages'), ': our legitimate interest in replying, or taking steps you ask for.'],
        [bold('Accounts and comments'), ': to provide the service you signed up for (contract).'],
        [bold('Legal obligations'), ': for example responding to lawful requests and keeping required records.'],
      ),
      p('We do not use your data for automated decisions that have legal or similarly significant effects on you.'),

      h2('4. Analytics (Google Analytics)'),
      p('With your consent, we use Google Analytics 4 to understand which stories people read and how they find us. It sets cookies and collects information such as pages visited, approximate location (city level), device type and how long you stay. IP addresses are not stored by Google Analytics 4. We use this only in aggregate. Learn ', a('how Google uses information from sites that use its services', 'https://policies.google.com/technologies/partner-sites'), '. You can also opt out with the ', a('Google Analytics opt-out browser add-on', 'https://tools.google.com/dlpage/gaoptout'), '.'),

      h2('5. Advertising'),
      p('When advertising is switched on, ads may be served by Google AdSense and other ad partners:'),
      ul(
        'Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website or other websites.',
        'Google’s use of advertising cookies enables it and its partners to serve ads to you based on your visits to this site and/or other sites on the Internet.',
        ['You may opt out of personalised advertising by visiting ', a('Google Ads Settings', 'https://www.google.com/settings/ads'), '.'],
        ['You can opt out of some third-party vendors’ uses of cookies for personalised advertising at ', a('aboutads.info', 'https://www.aboutads.info/choices/'), ' (US) and ', a('youronlinechoices.eu', 'https://www.youronlinechoices.eu/'), ' (EU/UK).'],
        ['Learn ', a('how Google uses data in advertising', 'https://policies.google.com/technologies/ads'), '.'],
      ),
      p('Any other ad networks serving ads on Clarity60 will be listed here, with links to their sites and opt-out pages. In the EU, UK and Switzerland, personalised ads are only shown after you consent; you can change your mind at any time with "Privacy choices" at the bottom of every page.'),

      h2('6. Cookies'),
      p('See our ', a('Cookie Policy', '/cookies'), ' for the full list and how to control them.'),

      h2('7. Who we share data with'),
      p('We do not sell your personal data for money. We share it only with providers who help us run the site, under contracts that limit their use of it:'),
      ul(
        'Hosting and delivery: DigitalOcean (servers), Cloudflare (network, security, DNS, email forwarding).',
        'Database and sign-in: Supabase.',
        'Images: ImageKit.',
        'Error monitoring: Sentry.',
        'Analytics and advertising: Google, and ad partners listed in section 5.',
        'Email delivery: Resend.',
        'Authorities, where the law requires it, or to protect our rights and users.',
      ),
      p('Under some US state laws, allowing advertising cookies for personalised ads can count as "sharing" personal data for cross-context behavioural advertising. You can opt out at any time (section 9).'),

      h2('8. International transfers'),
      p('Our providers may process data in the United States and other countries. Where data leaves the EU, UK or Switzerland, transfers rely on adequacy decisions (such as the EU-US Data Privacy Framework, where the provider is certified) or Standard Contractual Clauses.'),

      h2('9. Your rights and choices'),
      ul(
        [bold('Everyone: '), 'change cookie choices any time with "Privacy choices" at the bottom of every page, or block cookies in your browser.'],
        [bold('Global Privacy Control: '), 'if your browser sends a GPC signal, we treat it as an opt-out of personalised advertising and of any "sale" or "sharing" of your data.'],
        [bold('EU, UK and Switzerland: '), 'you can access, correct, delete or export your data, restrict or object to processing, and withdraw consent at any time without affecting earlier processing. You can complain to your data protection authority.'],
        [bold('California and other US states with privacy laws: '), 'you can know what data we collect, ask us to delete or correct it, opt out of the sale or sharing of personal data and of targeted advertising, and limit use of sensitive data (we do not collect sensitive data). We will not treat you differently for using these rights. You may use an authorised agent.'],
      ),
      p('To make a request, email ', mail, '. We reply within one month (or the time your local law requires) and may need to verify your identity first.'),

      h2('10. How long we keep data'),
      ul(
        'Analytics: up to 14 months.',
        'Server and security logs: up to 30 days.',
        'Error reports: up to 90 days.',
        'Emails: as long as needed to deal with your message, then up to 2 years.',
        'Accounts and comments: until you delete your account, then removed within 30 days (backups within 30 days after that).',
      ),

      h2('11. Security'),
      p('We protect data with encryption in transit (HTTPS everywhere, and verified encryption to our database), encrypted backups, two-factor authentication for all staff, access limited to people who need it, and regular security reviews. No system is perfectly secure; if a breach affects you, we will tell you and the authorities as the law requires.'),

      h2('12. Children'),
      p('Clarity60 is a general news site and is not directed at children under 13 (under 16 in the EU and UK for consent purposes). We do not knowingly collect their personal data. If you believe a child has given us personal data, email ', mail, ' and we will delete it.'),

      h2('13. Changes'),
      p('We will update this policy when our practices change and change the date at the top. Significant changes will be highlighted on the site.'),

      h2('14. Contact'),
      p(`${legalName}, ${address}. Email: `, mail, '.'),
    ),
  },
  {
    slug: 'cookies',
    title: 'Cookie Policy',
    description: 'The cookies and similar technologies Clarity60 uses, and how to control them.',
    body: doc(
      updated,
      p('Cookies are small files stored in your browser. We also use your browser’s local storage, which works similarly. This page lists what we use and why.'),
      h2('Your choices'),
      p('When you first visit, you can accept all cookies or keep essential cookies only. Change your mind any time with "Privacy choices" at the bottom of every page. In the EU, UK and Switzerland, analytics and advertising cookies stay off until you accept them. If your browser sends a Global Privacy Control signal, advertising personalisation stays off.'),
      h2('Strictly necessary (always on)'),
      ul(
        [bold('c60-theme'), ' (local storage, Clarity60): remembers Morning or Night Edition. Kept until you clear it.'],
        [bold('c60-consent'), ' (local storage, Clarity60): remembers your cookie choice. Kept until you clear it.'],
        [bold('__cf_bm, cf_clearance'), ' (Cloudflare): tell real visitors from bots and protect the site from attacks. 30 minutes to 1 year.'],
        [bold('payload-token'), ' (Clarity60, staff only): keeps editors signed in to the admin. Up to 8 hours.'],
      ),
      h2('Analytics (only with your consent)'),
      ul([bold('_ga, _ga_*'), ' (Google Analytics): count visitors and see which stories are read. Up to 14 months. ', a('How Google uses this data', 'https://policies.google.com/technologies/partner-sites'), '.']),
      h2('Advertising (only with your consent, when ads are on)'),
      ul(
        [bold('Google AdSense and partners'), ' (e.g. __gads, __gpi, IDE): show ads, limit how often you see them and measure them; personalise ads if you allow it. Up to 13 months. ', a('How Google uses cookies in advertising', 'https://policies.google.com/technologies/ads'), '.'],
      ),
      h2('Other ways to control cookies'),
      ul(
        'Block or delete cookies in your browser settings. The site works without analytics and advertising cookies.',
        ['Opt out of personalised Google ads at ', a('Google Ads Settings', 'https://www.google.com/settings/ads'), '.'],
        ['Opt out of other vendors’ personalised ads at ', a('aboutads.info', 'https://www.aboutads.info/choices/'), ' or ', a('youronlinechoices.eu', 'https://www.youronlinechoices.eu/'), '.'],
      ),
      p('Questions: ', mail, '. See also our ', a('Privacy Policy', '/privacy'), '.'),
    ),
  },
  {
    slug: 'terms',
    title: 'Terms of Use',
    description: 'The terms for using clarity60.com.',
    body: doc(
      updated,
      p(`These terms apply to your use of clarity60.com, published by ${legalName}. By using the site you agree to them. If you do not agree, please do not use the site.`),
      h2('1. Our content'),
      p('Clarity60’s articles, images, design and logo belong to us or our licensors and are protected by copyright and trademark law. You may read and share links to our stories, and quote short extracts with clear attribution and a link to the original. Republishing whole articles, systematic copying, or scraping for commercial use requires our written permission.'),
      h2('2. Information, not advice'),
      p('We work hard to be accurate and correct mistakes openly, but our content is general information. It is not legal, financial, medical or other professional advice. Check important decisions with a qualified professional.'),
      h2('3. Links, ads and affiliates'),
      p('We link to other websites and show ads; we are not responsible for their content, products or privacy practices. Some links are affiliate links, disclosed on the page. See our ', a('Advertising & Affiliate Disclosure', '/advertising-disclosure'), '.'),
      h2('4. Accounts and comments (when available)'),
      ul(
        'You must be at least 13 (16 in the EU/UK) to create an account, and you are responsible for activity on it.',
        'Be civil. Do not post spam, harassment, hate speech, threats, other people’s personal information, illegal content, or material you do not have the right to share.',
        'You keep ownership of your comments, and give us a non-exclusive, worldwide, royalty-free licence to display and moderate them on Clarity60.',
        'We may remove content and suspend accounts that break these rules.',
      ),
      h2('5. Acceptable use'),
      p('Do not attempt to disrupt, overload, probe or gain unauthorised access to the site, bypass its security, or use automated tools in a way that harms it or its users.'),
      h2('6. Copyright complaints'),
      p(`If you believe something on Clarity60 infringes your copyright, email `, mail, ` with: the work, where it appears on our site, your contact details, a statement that you believe in good faith the use is not authorised, and a statement that the information is accurate and that you are the owner or authorised to act for them. We will review it promptly and remove infringing material. Postal notices: ${legalName}, ${address}.`),
      h2('7. Disclaimers and liability'),
      p('The site is provided "as is". To the fullest extent the law allows, we do not guarantee it will always be available or error-free, and we are not liable for indirect or consequential losses arising from its use. Nothing in these terms limits liability that cannot be limited by law, or your rights as a consumer.'),
      h2('8. Changes'),
      p('We may update these terms; the date at the top shows the latest version. Continued use after changes means you accept them.'),
      h2('9. Governing law'),
      p(`These terms are governed by the laws of ${governingLaw}, without affecting any mandatory consumer protections of the country where you live.`),
      h2('10. Contact'),
      p(`${legalName}, ${address}. Email: `, mail, '.'),
    ),
  },
]
