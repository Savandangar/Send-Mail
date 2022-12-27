const puppeteer = require('puppeteer');
async function createPDF() {
    // Create a browser instance
    const browser = await puppeteer.launch();
    // Create a new page
    const page = await browser.newPage();
    const website_url = 'http://127.0.0.1:5501/index1.html';
    await page.goto(website_url, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');

    // Downlaod the PDF
    const pdf = await page.pdf({
        path: `receipt.pdf`,
        margin: { top: '50px', right: '50px', bottom: '50px', left: '50px' },
        printBackground: true,
        format: 'A4',
    });

    // Close the browser instance
    await browser.close();
    // return pdf;


}
module.exports = {
    createPDF
}