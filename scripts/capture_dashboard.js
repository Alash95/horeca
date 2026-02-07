import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function captureDashboard() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    console.log('Navigating to dashboard...');
    // Navigate to dashboard - assuming standard adjustment for local env
    // We might need to handle auth if it redirects to login
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
    
    // Simple check if we are redirected to login
    if (page.url().includes('login') || page.url() === 'http://localhost:5173/') {
        console.log('Redirected to login, attempting to snapshot login/landing or needs auth handling...');
        // For now, let's just snapshot what we see, or we'd need to automate login which is riskier without creds
        // But the user wants the DASHBOARD. 
        // Let's try to set a dummy session in localStorage if possible, or reliance on existing state if it persists (unlikely in puppeteer)
        // actually, looking at the previous attempts, the user asked to "access the overview page... through the service role key".
        // This implies bypassing auth or using a special access method. 
        // Since I cannot easily inject the service role key into the browser session securely from here without more complex setup, 
        // I will first try to capture whatever page loads. 
        // If it's the landing page, we might need to instruct the user or use a different approach.
    }

    // Wait for potential animations
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('Taking screenshot...');
    
    const screenshotPath = path.resolve(__dirname, '..', 'public', 'dashboard_snapshot.png');
    await page.screenshot({ 
        path: screenshotPath,
        fullPage: false 
    });
    
    console.log(`Screenshot saved to: ${screenshotPath}`);
    
    await browser.close();
    console.log('Done!');
}

captureDashboard().catch(console.error);
