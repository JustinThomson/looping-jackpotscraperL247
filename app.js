const express = require('express');
const AWS = require('aws-sdk');
const app = express();
require('dotenv').config();

app.get('/', (req, res) => {
    res.send("Welcome to the homepage");
});

app.listen(3000, () => {
    console.log('whazzuuup');

const puppeteer = require('puppeteer');
const CronJob = require('cron').CronJob;

const url = 'https://www.lotto247.com/en/play-lottery/powerball';

async function configureBrowser() {
const browser = await puppeteer.launch({
        headless:true,
        args: ["--no-sandbox"]
    });
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





//START OF NEW CODE FOR WRITING FILE TO S3 BUCKET
const fs = require('fs');

// Enter copied or downloaded access id and secret here
const ID = process.env.aws_access_key_id;
const SECRET = process.env.aws_secret_access_key;

// Enter the name of the bucket that you have created here
const BUCKET_NAME = 'lottofeeds';;


// Initializing S3 Interface
const s3 = new AWS.S3({
    accessKeyId: ID,
    secretAccessKey: SECRET
});

const uploadFile = (fileName) => {
    // read content from the file
    const fileContent = writedata;

    // setting up s3 upload parameters
    const params = {
        Bucket: BUCKET_NAME,
        Key: 'powerball.json', // file name you want to save as
        Body: fileContent
    };

    // Uploading files to the bucket
    s3.upload(params, function(err, data) {
        if (err) {
            throw err
        }
        console.log(`File uploaded successfully. ${data.Location}`)
    });
};
//END OF NEW CODE FOR WRITING FILE TO S3 BUCKET



uploadFile('powerball.json');








    console.log(writedata);
    
}


async function startTracking() {
    const page = await configureBrowser();

    let job = new CronJob('*/15 * * * * *', function(){ // runs every 2
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