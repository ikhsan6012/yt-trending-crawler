const puppeteer = require('puppeteer')
const fs = require('fs')

const BASE_URL = 'https://www.youtube.com/feed/trending'

const youtube = {
	browser: null,
	page: null,
	init: async () => {
		youtube.browser = await puppeteer.launch({
			headless: false,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		})
		youtube.page = await youtube.browser.newPage()
		youtube.page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36')
		youtube.page.setViewport({ width: 1366, height: 768 })
		youtube.page.setDefaultTimeout(60000)
		await youtube.page.goto(BASE_URL)
		await youtube.page.setRequestInterception(true)
		youtube.page.on('request', req => {
			if(req.resourceType() === 'image' || req.resourceType() === 'font' || req.resourceType() === 'stylesheet'){
				req.abort()
			} else {
				req.continue()
			}
		})
		await youtube.page.waitForSelector('#contents.style-scope.ytd-shelf-renderer')
	},
	getData: async counts => {
		let data = []
		const titles = await youtube.page.$$eval('#video-title', titles => titles.map(title => title.getAttribute('title')))
		const urls = await youtube.page.$$eval('#video-title', urls => urls.map(url => 'https://www.youtube.com' + url.getAttribute('href')))
		const bylines = await youtube.page.$$eval('#byline', bylines => bylines.map(byline => byline.textContent))
		const views = await youtube.page.$$eval('#metadata-line > span:nth-child(1)', views => views.map(view => view.textContent))
		const posteds = await youtube.page.$$eval('#metadata-line > span:nth-child(2)', posteds => posteds.map(posted => posted.textContent))
		const descriptions = await youtube.page.$$eval('#description-text', descriptions => descriptions.map(description => description.textContent))
		for(let i = 0; i < counts; i++) {
			if(titles[i]){
				data.push({
					title: titles[i],
					url: urls[i],
					metadata: {
						by: bylines[i],
						view: views[i],
						posted: posteds[i],
						description: descriptions[i]
					}
				})
			}
		}
		return data
	},
	saveData: async (data, path) => {
		await fs.writeFileSync(path, JSON.stringify(data, null, 4))
		console.log('success')
		await youtube.page.close()
		process.exit(1)
	}
}

module.exports = youtube