// const express = require('express');
const fetch = require('node-fetch');
const axios = require('axios');
const cheerio = require('cheerio');
const pdfreader = require("pdfreader");
// require('https').globalAgent.options.ca = require('ssl-root-cas').create();
const https = require('https');

const bypassSSLAgent = new https.Agent({  
    rejectUnauthorized: false
});


async function main() {
    const res = await axios("https://putusan3.mahkamahagung.go.id/direktori/index/kategori/ite-1.html", {
        httpsAgent: bypassSSLAgent
    })
    
    const $ = cheerio.load(res.data)
    
    const posts = []

    $('.spost').each((i, el) => {
        if (i >= 20) return;
        
        const title = $(el).children('.entry-c').children('strong').text()
        const link = $(el).children('.entry-c').children('strong').children('a').attr('href')
        posts.push({
            title, link
        })
    })

    for (const post of posts) {
        console.log("Fetching page: " + post.title)
        const postRes = await axios(post.link, {
            httpsAgent: bypassSSLAgent
        })

        const $post= cheerio.load(postRes.data)

        const toggleLampiran = $post('.togglet').filter(function(i, el) {
            return $post(el).text().trim() == 'Lampiran'
        })

        console.log(toggleLampiran.parents('.card').first().children('#collapseThree').find('a'))
        break;
    }
}

main().then((res) => console.log(res)).catch((err) => console.log(err));
// port
// app.listen(3000)