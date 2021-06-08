const express = require('express');
const AWS = require('aws-sdk');
const app = express();
const puppeteer = require('puppeteer');
const CronJob = require('cron').CronJob;
require('dotenv').config();

// Choose the number of parallel requests to run (1 is best for this script purpose)
const parallel = 1;
 
const lotteries = 
[
    { name: 'Powerball', url: 'https://www.lotto247.com/en/play-lottery/powerball' },
    { name: 'Powerball Plus', url: 'https://www.lotto247.com/en/play-lottery/powerball-plus' },
    { name: 'Mega Millions', url: 'https://www.lotto247.com/en/play-lottery/megamillions' },
    { name: 'Mega Millions Max', url: 'https://www.lotto247.com/en/play-lottery/mega-millions-max' }
]

 const scrapelotteries = async (lotteries, parallel) => {
   const parallelBatches = Math.ceil(lotteries.length / parallel)
   const objectdata = [];

   // Add new ad text into the adcopy variable below
   let adcopy = 
       {
        "playnow": {
            "en": "Play now",
            "es": "Juega ya",
            "pt": "Jogue agora"
            },
        "register": {
            "en": "Register",
            "es": "Registrarse",
            "pt": "Cadastre-se"
            } 
        };

   objectdata.push(adcopy);
 
   console.log('\nI have the task of extracting data from ' + lotteries.length + ' pages and will visit ' + parallel + ' of them in paralell.');
 
   console.log('\nThis will result in ' + parallelBatches + ' batches.');
   console.log('\nLets do this!');
 
   // Split up the Array of lotteries
   let k = 0
   for (let i = 0; i < lotteries.length; i += parallel) {
     k++
     console.log('\nBatch ' + k + ' of ' + parallelBatches)
     // Launch and Setup Chromium
     const browser = await puppeteer.launch({
        headless:true,
        args: ["--no-sandbox"]
    });
     // Fun with puppeteer
     const context = await browser.createIncognitoBrowserContext()
     const page = await context.newPage()

     const promises = []
     for (let j = 0; j < parallel; j++) {
       const elem = i + j
       // only proceed if there is an element
       if (lotteries[elem] !== undefined) {
         // Promise to scrape the page data
         // promises push
         console.log('\nI promise to extract data from: ' + lotteries[elem].name)
         promises.push(browser.newPage().then(async page => {
           
           try {
             // Only scrape page data if page.goto get's no error
             await page.setUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
             await page.setViewport({ width: 1280, height: 800 })
             await page.goto(lotteries[elem].url, {waitUntil: 'networkidle2'})
             await page.waitForSelector('div.jackpot.ng-star-inserted', {visible: true,}); // wait for the jackpot amount element to load before we extract data

             let lotteryname = await page.evaluate(() => document.querySelector('div.title.ng-star-inserted > h1').innerText);
             let jackpot = await page.evaluate(() => document.querySelector('div.jackpot.ng-star-inserted').innerText);
             let fullcountdown = await page.evaluate(() => document.querySelector('div.draw-time.ng-star-inserted > gli-game-counter > span').innerText);
             let minutecountdown = fullcountdown.slice(0,-5);
             let hourcountdown = fullcountdown.slice(0,-10);
             let price = await page.evaluate(() => document.querySelector('div.ticket-price.ng-star-inserted').innerText);
             let logo = await page.evaluate(() => document.querySelector('gli-lottery-game-banner > div > div > div > div > div > img').src);
             let pageURL = lotteries[elem].url;
         //    let slug = pagepath.split("/").pop().split(";")[0];
             let pagedata = {
                lotteryname,
                jackpot,
                fullcountdown,
                minutecountdown,
                hourcountdown,
                price,
                logo,
                pageURL
            };
            
            writedata = pagedata;
            
           } catch (err) {
             console.log('\nOops! I couldn\'t keep my promise to extract data from ' + lotteries[elem].name + '. Here is the error message:' + err)
           }
           console.log('\nI have successfully extracted the contents from the page.');
           objectdata.push(writedata);
           console.log('\nThis data has been pushed into the objectdata variable:\n' + JSON.stringify(writedata));
           console.log('\nThe objectdata variable now contains:\n' + JSON.stringify(objectdata));
         }))
       }
     }
 
     // await promise all and close browser
     await Promise.all(promises)
     await browser.close()
     console.log('\nI finished this batch. I\'m ready for the next batch')
   }

   console.log('\nAll done with scraping the data and storing it in an object! Now lets write it to disk.\n')

  
  const fs = require('fs');

  // START OF NEW AWS CODE
   // Enter copied or downloaded access id and secret here
   const ID = process.env.aws_access_key_id;
   const SECRET = process.env.aws_secret_access_key;

   // Enter the name of the bucket that you have created here
   const BUCKET_NAME = 'lottofeeds';

   // Initializing S3 Interface
   const s3 = new AWS.S3({
       accessKeyId: ID,
       secretAccessKey: SECRET
   });

   const uploadFile = (fileName) => {
       // read content from the file
       const fileContent = JSON.stringify(objectdata);

       // setting up s3 upload parameters
       const params = {
           Bucket: BUCKET_NAME,
           Key: fileName, // file name
           Body: fileContent
       };

       // Uploading files to the bucket
       s3.upload(params, function(err, data) {
           if (err) {
               throw err
           }
           console.log(`\nI have uploaded the file successfully to here: ${data.Location}`)
       });
   };

   uploadFile('jackpotfeed.json');
   // END OF NEW AWS CODE



  //write the file to disk
/*
  const filepath = './jackpotfeed.json';
  fs.writeFile(filepath, JSON.stringify(objectdata), 'utf8', (err) => {
      if (err) {
          console.log('Error');
      } else {
          console.log ('\nI have saved the JSON file to\n' + filepath);
          console.log("\nHere are the contents of the JSON:\n" + JSON.stringify(objectdata));
      }

  }); 
  */
  // End of writing to desk


 }
 



 async function startTracking(){
    let job = new CronJob('*/60 * * * * *', function(){ // runs every 15 seconds
        scrapelotteries(lotteries, parallel);
    }, null, true, null, null, true);
    job.start();
 }

 startTracking();