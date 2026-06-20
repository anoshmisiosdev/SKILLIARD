/**
 * Candidate selectors per platform. Social sites change their DOM constantly,
 * so each "slot" is an ordered list of selectors we try in turn. The poster
 * modules use the first one that resolves. When none match, we fall back to a
 * clear manual instruction set rather than guessing/clicking aggressively.
 */

export interface PlatformSelectors {
  url: string;
  /** Signals the user IS logged in (composer reachable). */
  loggedInSignals: string[];
  /** Signals the user is NOT logged in (login wall). */
  loggedOutSignals: string[];
  /** Optional button to open the composer (X inline doesn't need it). */
  openComposer: string[];
  /** The editable composer element. */
  composer: string[];
  /** The final publish/post button. */
  publish: string[];
}

export const X: PlatformSelectors = {
  url: "https://x.com/home",
  loggedInSignals: [
    '[data-testid="SideNav_NewTweet_Button"]',
    '[data-testid="tweetTextarea_0"]',
    '[data-testid="AppTabBar_Home_Link"]',
  ],
  loggedOutSignals: ['a[href="/login"]', '[data-testid="loginButton"]', 'a[href="/i/flow/login"]'],
  openComposer: ['[data-testid="SideNav_NewTweet_Button"]', 'a[href="/compose/post"]'],
  composer: ['[data-testid="tweetTextarea_0"]', 'div[role="textbox"][data-testid^="tweetTextarea"]'],
  publish: ['[data-testid="tweetButtonInline"]', '[data-testid="tweetButton"]'],
};

export const LINKEDIN: PlatformSelectors = {
  url: "https://www.linkedin.com/feed/",
  loggedInSignals: [
    'button[aria-label*="Start a post" i]',
    '.share-box-feed-entry__trigger',
    "#global-nav",
  ],
  loggedOutSignals: ['form.login__form', 'input[name="session_key"]', 'a[href*="/login"]'],
  openComposer: [
    'button[aria-label*="Start a post" i]',
    '.share-box-feed-entry__trigger',
    'button.artdeco-button:has-text("Start a post")',
  ],
  composer: [
    '.ql-editor[contenteditable="true"]',
    'div[role="textbox"][contenteditable="true"]',
    'div.editor-content div[contenteditable="true"]',
  ],
  publish: [
    'button.share-actions__primary-action',
    'button[aria-label*="Post" i]:not([aria-label*="Start" i])',
    'div.share-box_actions button:has-text("Post")',
  ],
};

export const INSTAGRAM: PlatformSelectors = {
  url: "https://www.instagram.com/",
  loggedInSignals: [
    'a[href="/explore/"]',
    'svg[aria-label="New post"]',
    'svg[aria-label="Home"]',
    '[aria-label="New post"]',
  ],
  loggedOutSignals: ['input[name="username"]', 'input[name="password"]', 'button:has-text("Log in")'],
  openComposer: [
    'svg[aria-label="New post"]',
    '[aria-label="New post"]',
    'a[href="#"]:has(svg[aria-label="New post"])',
  ],
  // Instagram's caption box appears late in the create flow.
  composer: ['textarea[aria-label*="caption" i]', 'div[aria-label*="caption" i][contenteditable="true"]'],
  publish: [
    'div[role="button"]:has-text("Share")',
    'button:has-text("Share")',
    'div[role="button"]:has-text("Post")',
  ],
};
