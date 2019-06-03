const yt = require('./youtube-trending')

const run = async () => {
	try{
		await yt.init()
		const data = await yt.getData(process.argv[2] || 10)
		await yt.saveData(data, process.argv[3] || 'trending.json')
	} catch(err) {
		console.log(err)
		process.exit(1)
	}
}

run()