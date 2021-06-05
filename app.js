const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send("Welcome to the homepage");
});

app.listen(3000, () => {
    console.log('whazzuuup');

const puppeteer = require('puppeteer');
const CronJob = require('cron').CronJob;

const url = 'https://www.lotto247.com/en/play-lottery/powerball';

async function configureBrowser() {
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
await page.goto(url, {waitUntil: 'networkidle2'});
return page;
}

async function checkJackpot(page) {



    let html = await page.evaluate(() => document.body.innerHTML);
    let lotteryname = await page.evaluate(() => document.querySelector('div.title.ng-star-inserted > h1').innerText);
    let jackpot = await page.evaluate(() => document.querySelector('div.jackpot.ng-star-inserted').innerText);
    let fullcountdown = await page.evaluate(() => document.querySelector('div.draw-time.ng-star-inserted > gli-game-counter > span').innerText);
    let minutecountdown = fullcountdown.slice(0,-5);
    let hourcountdown = fullcountdown.slice(0,-11);
    let price = await page.evaluate(() => document.querySelector('div.ticket-price.ng-star-inserted').innerText);
    let logo = await page.evaluate(() => document.querySelector('gli-lottery-game-banner > div > div > div > div > div > img').src);


    let pagedata = {
        lotteryname,
        jackpot,
        fullcountdown,
        minutecountdown,
        hourcountdown,
        price,
        logo
    }; 

    

    // convert JSON object to string
    const writedata = JSON.stringify(pagedata);

    //write file to disk
    const fs = require('fs');
    fs.writeFile('./powerball.json', writedata, 'utf8', (err) => {
        if (err) {
            console.log('Error');
        } else {
            console.log ('great success');
        }

    });


    console.log(writedata);
    
}


async function startTracking() {
    const page = await configureBrowser();

    let job = new CronJob('*/15 * * * * *', function(){ // runs every 15 secs
        checkJackpot(page);
    }, null, true, null, null, true);
    job.start();
}

startTracking();


//async function monitorJackpot() {
//    let page = await configureBrowser();
//    await checkJackpot(page);
//}

// monitorJackpot();

});