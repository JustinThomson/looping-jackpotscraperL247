const AWS = require('aws-sdk');
const puppeteer = require('puppeteer');
const CronJob = require('cron').CronJob;
const CC = require('currency-converter-lt');
require('dotenv').config();


// USD to Nigerian Naira conversion
let USDNGNconverter = new CC({from:"USD", to:"NGN", amount:1})
let USDNGNrate = 0;
USDNGNconverter.convert().then((response) => {
  USDNGNrate = response; //or do something else
});
// EUR to Nigerian Naira conversion
let EURNGNconverter = new CC({from:"EUR", to:"NGN", amount:1})
let EURNGNrate = 0;
EURNGNconverter.convert().then((response) => {
  EURNGNrate = response; //or do something else
});
// AUD to Nigerian Naira conversion
let AUDNGNconverter = new CC({from:"AUD", to:"NGN", amount:1})
let AUDNGNrate = 0;
AUDNGNconverter.convert().then((response) => {
  AUDNGNrate = response; //or do something else
});
// GBP to Nigerian Naira conversion
let GBPNGNconverter = new CC({from:"GBP", to:"NGN", amount:1})
let GBPNGNrate = 0;
GBPNGNconverter.convert().then((response) => {
  GBPNGNrate = response; //or do something else
});
// BRL to Nigerian Naira conversion
let BRLNGNconverter = new CC({from:"BRL", to:"NGN", amount:1})
let BRLNGNrate = 0;
BRLNGNconverter.convert().then((response) => {
  BRLNGNrate = response; //or do something else
});

// USD to Indian Rupees conversion
let USDINRconverter = new CC({from:"USD", to:"INR", amount:1})
let USDINRrate = 0;
USDINRconverter.convert().then((response) => {
  USDINRrate = response; //or do something else
});
// EUR to Indian Rupees conversion
let EURINRconverter = new CC({from:"EUR", to:"INR", amount:1})
let EURINRrate = 0;
EURINRconverter.convert().then((response) => {
  EURINRrate = response; //or do something else
});
// AUD to Indian Rupees conversion
let AUDINRconverter = new CC({from:"AUD", to:"INR", amount:1})
let AUDINRrate = 0;
AUDINRconverter.convert().then((response) => {
  AUDINRrate = response; //or do something else
});
// GBP to Indian Rupees conversion
let GBPINRconverter = new CC({from:"GBP", to:"INR", amount:1})
let GBPINRrate = 0;
GBPINRconverter.convert().then((response) => {
  GBPINRrate = response; //or do something else
});
// BRL to Indian Rupees conversion
let BRLINRconverter = new CC({from:"BRL", to:"INR", amount:1})
let BRLINRrate = 0;
BRLINRconverter.convert().then((response) => {
  BRLINRrate = response; //or do something else
});




// Choose the number of parallel requests to run (1 is best for this script purpose)
const parallel = 1;
 
const lotteries = 
[
    { name: 'Powerball', url: 'https://www.lotto247.com/en/play-lottery/powerball' },
    { name: 'Powerball Plus', url: 'https://www.lotto247.com/en/play-lottery/powerball-plus' },
    { name: 'Mega Millions', url: 'https://www.lotto247.com/en/play-lottery/megamillions' },
    { name: 'Mega Millions Max', url: 'https://www.lotto247.com/en/play-lottery/mega-millions-max' },
    { name: 'SuperEna Max', url: 'https://www.lotto247.com/en/play-lottery/superenamax' },
    { name: 'Powerball', url: 'https://www.playhugelottos.com/en/play-the-lottery/usa-powerball.html' },
    { name: 'Powerball Plus', url: 'https://www.playhugelottos.com/en/play-the-lottery/usa-powerball-plus.html' },
    { name: 'Mega Millions', url: 'https://www.playhugelottos.com/en/play-the-lottery/usa-mega-millions.html' },
    { name: 'Mega Millions Max', url: 'https://www.playhugelottos.com/en/play-the-lottery/usa-mega-millions-max.html' },
    { name: 'SuperEna Max', url: 'https://www.playhugelottos.com/en/play-the-lottery/superenamax.html' }
]

 const scrapelotteries = async (lotteries, parallel) => {
   const parallelBatches = Math.ceil(lotteries.length / parallel)

   // Create an empty object to store all the scraped data
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

            if(lotteries[elem].url.includes("lotto247")) {
             // Only scrape page data if page.goto get's no error
             await page.setUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
             await page.setViewport({ width: 1280, height: 800 })
             await page.goto(lotteries[elem].url, {waitUntil: 'networkidle2'})
             await page.waitForSelector('div.jackpot.ng-star-inserted', {visible: true,}); // wait for the jackpot amount element to load before we extract data

             let lotteryname = lotteries[elem].name;
             let jackpot = await page.evaluate(() => document.querySelector('div.jackpot.ng-star-inserted').innerText);

             let jackpotInteger = parseInt(jackpot.replace(/\D/g,''));
             console.log('The jackpot amount displayed as an Integer is:' + jackpotInteger);


             let lottocurrency = '';
             let jackpotNGNvalue = 0;
             let jackpotINRvalue = 0;

             let rawcurrencylabel = jackpot.charAt(0);
             if (rawcurrencylabel ==='$') {
                lottocurrency = 'USD';
                jackpotNGNvalue = jackpotInteger * USDNGNrate;
                jackpotINRvalue = jackpotInteger * USDINRrate;
             } else if (rawcurrencylabel ==='???') {
                lottocurrency = 'EUR';
                jackpotNGNvalue = jackpotInteger * EURNGNrate;
                jackpotINRvalue = jackpotInteger * EURINRrate;
             } else if (rawcurrencylabel ==='A') {
                lottocurrency = 'AUD';
                jackpotNGNvalue = jackpotInteger * AUDNGNrate;
                jackpotINRvalue = jackpotInteger * AUDINRrate;
             } else if (rawcurrencylabel ==='??') {
                lottocurrency = 'GBP';
                jackpotNGNvalue = jackpotInteger * GBPNGNrate;
                jackpotINRvalue = jackpotInteger * GBPINRrate;
             } else if (rawcurrencylabel ==='R') {
                lottocurrency = 'BRL';
                jackpotNGNvalue = jackpotInteger * BRLNGNrate;
                jackpotINRvalue = jackpotInteger * BRLINRrate;
             }

             nigeriaNumberFormat = new Intl.NumberFormat('en-NG');
             indiaNumberFormat = new Intl.NumberFormat('en-IN');
             let jackpotNaira = '??? ' + nigeriaNumberFormat.format(jackpotNGNvalue);
             let jackpotRupees = '???' + indiaNumberFormat.format(jackpotINRvalue);

             let fullcountdown = await page.evaluate(() => document.querySelector('div.draw-time.ng-star-inserted > gli-game-counter > span').innerText);
             let minutecountdown = fullcountdown.slice(0,-5);
             let hourcountdown = fullcountdown.slice(0,-11);
             let price = await page.evaluate(() => document.querySelector('div.ticket-price.ng-star-inserted').innerText);
             let logo = await page.evaluate(() => document.querySelector('gli-lottery-game-banner > div > div > div > div > div > img').src);
             let pageURL = lotteries[elem].url;
             let pagedata = {
                lotteryname,
                jackpot,
                fullcountdown,
                minutecountdown,
                hourcountdown,
                price,
                logo,
                pageURL,
                jackpotNaira,
                jackpotRupees
            };
            
            writedata = pagedata;
            
           } else if(lotteries[elem].url.includes("playhugelottos")) {
            // Only scrape page data if page.goto get's no error
            await page.setUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
            await page.setViewport({ width: 1280, height: 800 })
            await page.goto(lotteries[elem].url, {waitUntil: 'networkidle2'})
            await page.waitForSelector('div.timer-wrapper > div.angular-my-timer-date.ng-binding', {visible: true,}); // wait for the jackpot amount element to load before we extract data

            let lotteryname = lotteries[elem].name;
            let jackpot = await page.evaluate(() => document.querySelector('div.col-lg-12.grey-bg.lotto-logo-holder > div > div.col-lg-4.col-sm-4.col-xs-12.center > div:nth-child(6) > div:nth-child(2) > span').innerText);


            let jackpotInteger = parseInt(jackpot.replace(/\D/g,''));
             console.log('The jackpot amount displayed as an Integer is:' + jackpotInteger);


             let lottocurrency = '';
             let jackpotNGNvalue = 0;
             let jackpotINRvalue = 0;

             let rawcurrencylabel = jackpot.substring(0,3);
             if (rawcurrencylabel ==='USD') {
                lottocurrency = 'USD';
                jackpotNGNvalue = jackpotInteger * USDNGNrate;
                jackpotINRvalue = jackpotInteger * USDINRrate;
             } else if (rawcurrencylabel ==='EUR') {
                lottocurrency = 'EUR';
                jackpotNGNvalue = jackpotInteger * EURNGNrate;
                jackpotINRvalue = jackpotInteger * EURINRrate;
             } else if (rawcurrencylabel ==='AUD') {
                lottocurrency = 'AUD';
                jackpotNGNvalue = jackpotInteger * AUDNGNrate;
                jackpotINRvalue = jackpotInteger * AUDINRrate;
             } else if (rawcurrencylabel ==='GBP') {
                lottocurrency = 'GBP';
                jackpotNGNvalue = jackpotInteger * GBPNGNrate;
                jackpotINRvalue = jackpotInteger * GBPINRrate;
             } else if (rawcurrencylabel ==='BRL') {
                lottocurrency = 'BRL';
                jackpotNGNvalue = jackpotInteger * BRLNGNrate;
                jackpotINRvalue = jackpotInteger * BRLINRrate;
             }

             nigeriaNumberFormat = new Intl.NumberFormat('en-NG');
             indiaNumberFormat = new Intl.NumberFormat('en-IN');
             let jackpotNaira = '??? ' + nigeriaNumberFormat.format(jackpotNGNvalue);
             let jackpotRupees = '???' + indiaNumberFormat.format(jackpotINRvalue);


            let nextdrawdate = await page.evaluate(() => document.querySelector('div.timer-wrapper > div.angular-my-timer-date.ng-binding').innerText);
            let daysremain = await page.evaluate(() => document.querySelector('div.timer-wrapper > div:nth-child(2) > div > div:nth-child(1) > span').innerText);
            let hoursremain = await page.evaluate(() => document.querySelector('div.timer-wrapper > div:nth-child(2) > div > div:nth-child(2) > span').innerText);
            let minutesremain = await page.evaluate(() => document.querySelector('div.timer-wrapper > div:nth-child(2) > div > div:nth-child(3) > span').innerText);
            let secondsremain = await page.evaluate(() => document.querySelector('div.timer-wrapper > div:nth-child(2) > div > div:nth-child(4) > span').innerText);
            let fullcountdown = daysremain + "d : " + hoursremain + "h : " + minutesremain + "m : " + secondsremain + "s";
            let minutecountdown = daysremain + "d : " + hoursremain + "h : " + minutesremain + "m"; 
            let hourcountdown = daysremain + "d : " + hoursremain + "h"; 
            let logo = await page.evaluate(() => document.querySelector('div.col-lg-4.col-sm-4.col-xs-12.lotto-logo > a:nth-child(2) > img').src);
            let pageURL = lotteries[elem].url;
            let pagedata = {
               lotteryname,
               jackpot,
               nextdrawdate,
               fullcountdown,
               minutecountdown,
               hourcountdown,
               logo,
               pageURL,
               jackpotNaira,
               jackpotRupees
           };
           
           writedata = pagedata;
           
          } 
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
    let job = new CronJob('*/10 * * * *', function(){ // runs every 10 minutes
        scrapelotteries(lotteries, parallel);
    }, null, true, null, null, true);
    job.start();
 }

 startTracking();