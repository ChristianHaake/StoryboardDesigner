import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

const preview = spawn('npm', ['run', 'preview'], { cwd: '/Users/christianhaake/Git-Repos/StoryboardCreator' });

preview.stdout.on('data', async (data) => {
  const str = data.toString();
  console.log('[VITE]', str);
  if (str.includes('http://localhost:')) {
    const url = 'https://storyboarddesigner.notionsworker.workers.dev/';
    if (url) {
      console.log('Connecting to', url);
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      
      page.on('console', msg => console.log('PAGE LOG:', msg.text(), msg.location().url));
      page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
      page.on('error', err => console.log('ERROR:', err.toString()));
      page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure()?.errorText));
      page.on('response', res => {
        if (!res.ok()) console.log('RES NOT OK:', res.status(), res.url());
      });
      
      await page.goto(url, { waitUntil: 'networkidle0' });
      
      const content = await page.content();
      const rootHtml = await page.$eval('#root', el => el.innerHTML).catch(() => 'no #root found');
      console.log('ROOT HTML LENGTH:', rootHtml.length);
      console.log('ROOT HTML:', rootHtml.substring(0, 500));
      
      const bodyHtml = await page.$eval('body', el => el.innerHTML);
      console.log('BODY HTML LENGTH:', bodyHtml.length);
      
      console.log('Done waiting.');
      await browser.close();
      preview.kill();
      process.exit(0);
    }
  }
});
