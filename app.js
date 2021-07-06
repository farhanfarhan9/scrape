import axios from 'axios'
import cheerio from 'cheerio'
import https from 'https'
import download from 'download'

const bypassSSLAgent = new https.Agent({  
    rejectUnauthorized: false
});

async function getPages(pageNumber = null) {
    const firstPageUrl = "https://putusan3.mahkamahagung.go.id/direktori/index/kategori/ite-1.html"
    const pageUrlWithNumber = `https://putusan3.mahkamahagung.go.id/direktori/index/kategori/ite-1/page/${pageNumber}.html`

    const res = await axios(pageNumber ? pageUrlWithNumber : firstPageUrl , {
        httpsAgent: bypassSSLAgent
    })

    return res.data
}

const res = await getPages();
const firstFetch = cheerio.load(res)
const lastPage = firstFetch('a.page-link:contains("Last")').data('ci-pagination-page')

for (let i = lastPage; i > 0; i--) {
    console.log(`Halaman ${i}`);
    const pageRes = await getPages(i);
    const $ = cheerio.load(pageRes)
    const pagePosts = []

    $('.spost').each((i, el) => {
        if (i >= 20) return;
        const title = $(el).children('.entry-c').children('strong').text()
        const link = $(el).children('.entry-c').children('strong').children('a').attr('href')
        if (link == undefined) return;
        const hash = new URL(link).pathname.split('/')[3].split('.')[0]
        pagePosts.push({
            title, link, hash
        })
        console.log(`Found post/putusan [${title}]`)
    })

    pagePosts.reverse()
    // posts.push(...pagePosts)

    for (const post of pagePosts) {
        console.log("Fetching page: " + post.title)
    
        const postRes = await axios(post.link, {
            httpsAgent: bypassSSLAgent
        })
    
        const $post = cheerio.load(postRes.data)
        const pdfDownloadAnchor = $post('a[href*="/pdf/"]');
        if (pdfDownloadAnchor.attr('href') == undefined) {
            console.log("Download link tidak tersedia.")
        }
        const filename = pdfDownloadAnchor.text().replace(/\//gi, '_')
        const fileurl = pdfDownloadAnchor.attr('href')
        console.log(`Download file pdf [${filename}]`)
        await download(fileurl, 'downloads', {
            agent: {
                https: bypassSSLAgent,
            },
            filename: filename
        });
        console.log(`Download file pdf [${filename}] selesai`)
    }
}

