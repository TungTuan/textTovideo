const fs = require("fs");
const express = require("express");
const multer = require("multer");
// const OAuth2Data = require("./credentials.json");
const https = require('https');
const gtts = require('gtts');
const { exec } = require("child_process");

const db = require('./config/db');
var Jimp = require("jimp");
// const Credential = require('./models/Credentials')
db.connect();
var title, description;
var tags = [];

const { google } = require("googleapis");

const app = express();

var CLIENT_ID ;
var CLIENT_SECRET ;
var REDIRECT_URL ;

var oAuth2Client = null;

var oAuth2ClientToken;
var oAuthIndex = 0;
var code2 = '';
var authed = false;

var token = '';
var credentialsList = [];
// var indexCredential = 0;
// If modifying these scopes, delete token.json.
const SCOPES =
	"https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/userinfo.profile";

app.set("view engine", "ejs");

var Storage = multer.diskStorage({
	destination: function (req, file, callback) {
		callback(null, "./");
	},
	filename: function (req, file, callback) {
		callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
	},
});

var upload = multer({
	storage: Storage,
}).single("file"); //Field name and max count


app.get("/", (req, res) => {
	// Credential.find({}, function(err, credentials) {
	// 	if (!err) {
	// 		console.log('=================output credentials', credentials);
	// 		credentialsList = credentials;
	// 		if (!authed) {
	// 			indexCredential = credentials.findIndex(el => el.count < 5);
	// 			console.log("================indexCredential", indexCredential);
	// 			CLIENT_ID = credentialsList[indexCredential].client_id;
	// 			CLIENT_SECRET = credentialsList[indexCredential].client_secret;
	// 			REDIRECT_URL = credentialsList[indexCredential].redirect_uris[0];
	// 			oAuth2Client = new google.auth.OAuth2(
	// 				CLIENT_ID,
	// 				CLIENT_SECRET,
	// 				REDIRECT_URL
	// 		);
	// 			// Generate an OAuth URL and redirect there
	// 			var url = oAuth2Client.generateAuthUrl({
	// 				access_type: "offline",
	// 				scope: SCOPES,
	// 			});
	// 			console.log('======>url', url);
	// 			res.render("index", { url: url });
	// 		} else {
	// 			var oauth2 = google.oauth2({
	// 				auth: oAuth2Client,
	// 				version: "v2",
	// 			});
	// 			oauth2.userinfo.get(function (err, response) {
	// 				if (err) {
	// 					console.log(err);
	// 				} else {
	// 					console.log(response.data);
	// 					name = response.data.name;
	// 					pic = response.data.picture;
	// 					res.render("success", {
	// 						name: response.data.name,
	// 						pic: response.data.picture,
	// 						success: false,
	// 					});
	// 				}
	// 			});
	// 		}
	// 	} else {
	// 		console.log('=================credentials errr')
	// 	}
	// });
	res.render("success", {
		name: '',
		pic: '',
		success: false,
	});
});



app.post("/upload", (req, res) => {
	upload(req, res, function (err) {
		var text = req.body.text

		var language = req.body.language

		outputFilePath ="videos/" + Date.now() + "output.mp3";
		outputMp4FilePath = "videos/"+req.body.thumbTitle+"/" +Date.now() + "output.mp4";
		outputMp4FilePathText = "videos/"+req.body.thumbTitle+"/" +Date.now() + "output2.mp4";
		txtFile = "videos/"+req.body.thumbTitle+"/" + Date.now() + "text.txt";
		fileName = req.file.path;
		imageCaption ="#" + req.body.thumbTitle

		Jimp.read(fileName)
		.then(function (image) {
			image.resize(320,180);
			loadedImage = image;
			return Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);
		})
		.then(function (font) {
			loadedImage.print(font, 10, 10, imageCaption)
					.write("videos/"+req.body.thumbTitle+"/"+fileName);
			console.log('image success');
			// fs.writeFileSync("thumbnail/"+fileName);
		})
		.catch(function (err) {
			console.error(err);
		});

		var voice = new gtts(text, language)
		voice.save(outputFilePath, function (err, result) {
			console.log('xxxxxxxxxxxxxx', outputFilePath);
			if (fs.existsSync(outputFilePath)) {
				console.log('mp3 success');
				// uploadYoutube('');
				fs.writeFileSync(txtFile, text);
				exec(`ffmpeg -loop 1 -i ${fileName} -i ${outputFilePath} -c:a copy -c:v libx264 -shortest ${outputMp4FilePath}`, (error, stdout, stderr) => {

					if (fs.existsSync(outputMp4FilePath) && fs.existsSync(txtFile)) {
						console.log('=>>>>>>>>', 'finish Text')
						// exec(`ffmpeg  -i ${outputMp4FilePath} -vf drawtext="fontfile=C\\:/Windows/Fonts/arial.ttf:textfile=text.txt : x=(w-tw)/2:y=h-t*100:fontcolor=red:fontsize=40" ${outputMp4FilePathText}`, (error, stdout, stderr) => {
						// exec(`ffmpeg -i ${outputMp4FilePath} -ss 00:00:00 -t 00:01:30 -vf "drawtext=textfile=${txtFile}: x=(w-text_w)/2+20:y=h-40*t:line_spacing=80:fontfile=/Windows/Fonts/arial.ttf: fontsize=36:fontcolor=yellow@0.9: box=1: boxcolor=black@0.6" -c:a copy ${outputMp4FilePathText}`, (error, stdout, stderr) => {
							// ffmpeg -i ${outputMp4FilePath} color=green@0.0:s=1280x720:rate=60,format=rgba -ss 00:00:00 -t 00:01:30 -vf "drawtext=fontfile=/Windows/Fonts/arial.ttf:fontsize=60:fontcolor=green:x=(w-text_w)/2+20:y=h-40*t:line_spacing=80:textfile=${txtFile}" -c:a copy ${outputMp4FilePathText}
						if (fs.existsSync(outputMp4FilePath)) {
							// uploadYoutube(req,res, outputMp4FilePath)
							// console.log('mp4 success');
							// res.render("success", { name: ' ', pic: ' ', success: true });
							  res.download(outputMp4FilePath,(err) => {
								if(err){
									fs.unlinkSync(outputMp4FilePath)
									res.send("Unable to download the file")
								}
								fs.unlinkSync(outputMp4FilePath)
								});
						}
						if (error) {
							console.log(`error: ${error.message}`);
							return;
						}
						if (stderr) {
							console.log(`stderr: ${stderr}`);
							return;
						}
						console.log(`stdout: ${stdout}`);
					}
					if (error) {
						console.log(`error: ${error.message}`);
						return;
					}
					if (stderr) {
						console.log(`stderr: ${stderr}`);
						return;
					}
				});

			}
		})
	

	});
});

var uploadYoutube = function(req, res, file) {
	title = req.body.title;
	description = req.body.description;
	tags = req.body.tags;

	const youtube = google.youtube({ version: "v3", auth: oAuth2Client });
	console.log(youtube)
	youtube.videos.insert(
		{
			resource: {
				// Video title and description
				snippet: {
					title: title,
					description: description,
					tags: tags,
					defaultLanguage: req.body.language,
					defaultAudioLanguage: req.body.language
				},
				// I don't want to spam my subscribers
				status: {
					privacyStatus: "private",
					madeForKids: false
				},
			},
			// This is for the callback function
			part: "snippet,status",

			// Create the readable stream to upload the video
			media: {
				body: fs.createReadStream(file)
			},
		},
		(err, data) => {
			if (err) {
				console.log('============================err', err)
				// oAuthIndex++;
				refreshToken(res);
			} else {
				youtube.thumbnails.set({
					// auth: auth,
					videoId: data.data.id,
					media: {
						body: fs.createReadStream("thumbnail/"+fileName)
					},
					}, (err, data) => {
					credentialsList[indexCredential].count++;
					console.log('========================1', credentialsList[indexCredential])
					Credential.updateOne({_id: credentialsList[indexCredential].id}, credentialsList[indexCredential])
								.then(() => console.log("update credential count"));

					if (credentialsList[indexCredential].count == 5) {
						refreshToken(res);
					}

					console.log("Done.");
					fs.unlinkSync(file);
					res.render("success", { name: name, pic: pic, success: true });
					});
			}
		}
	);
}

var refreshToken = function(res) {
				indexCredential = credentialsList.findIndex(el => el.count < 5 && el.id !== credentialsList[indexCredential].id);
				console.log('===========newIndex', indexCredential);
				CLIENT_ID = OAuth2Data[indexCredential].web.client_id;
				CLIENT_SECRET = OAuth2Data[indexCredential].web.client_secret;
				REDIRECT_URL = OAuth2Data[indexCredential].web.redirect_uris[0];
				
				oAuth2Client = new google.auth.OAuth2(
					CLIENT_ID,
					CLIENT_SECRET,
					REDIRECT_URL
				);

				var url = oAuth2Client.generateAuthUrl({
					access_type: "offline",
					scope: SCOPES,
				});
				res.redirect(url);
				oAuth2Client.getToken(code2, function (err, tokens) {
					if (err) {
						console.log("Error authenticating");
						console.log(err);
					} else {
						console.log("Successfully authenticated");
						console.log(">>>>", tokens);
						token = tokens;
						oAuth2ClientToken = tokens;
						oAuth2Client.setCredentials(tokens);
						// uploadYoutube(req, res, file);
					}
				});
}

app.get("/logout", (req, res) => {
	authed = false;
	res.redirect("/");
});

app.get("/rsCounter", (req, res) => {
	credentialsList.forEach(element => {
		if (element.count > 0) {
			element.count = 0;
			Credential.updateMany({_id: element.id}, element)
										.then(() => console.log("update credential count"));
		}
	});
	res.redirect("/");
});

app.get("/google/callback", function (req, res) {
	const code = req.query.code;
	code2 =  req.query.code;
	if (code) {
		// Get an access token based on our OAuth code
		oAuth2Client.getToken(code, function (err, tokens) {
			if (err) {
				console.log("Error authenticating");
				console.log(err);
			} else {
				console.log("Successfully authenticated");
				console.log(">>>>", tokens);
				token = tokens;
				oAuth2ClientToken = tokens;
				oAuth2Client.setCredentials(tokens);
				authed = true;
				res.redirect("/");
			}
		});
	}
});


app.listen(5000, () => {
	console.log("App is listening on Port 5000");
});
