var nodemailer = require('nodemailer');
const formidable = require('formidable');
const fs = require('fs');
var path = require('path');
var mv = require('mv');
const AWS = require('aws-sdk')
var Hogan = require('hogan.js')
const { exec } = require('child_process');
const jwtToken = require('jsonwebtoken');
const {
    secret
} = require('../config/config.js');


const response = (data, message = "success") => {
    return { status: true, status_code: 200, data: data, message: message };
};
const error = (data, message = "") => {
    return { status: false, status_code: 400, data: data, message: message };
};


const transporter = nodemailer.createTransport({
    port: 465,  // true for 465, false for other ports
    host: "smtpout.secureserver.net",
    auth: {
        user: process.env.MAIL_ID,
        pass: process.env.MAIL_PASSWORD,
    },
    secure: true,
});


const sendmails = function (to_email, email_detail) {
    var html = "";
    var subject = "";
    if (email_detail.template_code == 'FORGOT PASSWORD') {
        let template = fs.readFileSync(__dirname + "/../views/reset_password.hjs", 'utf8');
       
        var compiledTemplate = Hogan.compile(template)
        subject = "Grad Stock Forgot Password Link"
        html = compiledTemplate.render({ token:email_detail.token ,username:email_detail.username})
    }
    if (email_detail.template_code == 'ADMIN FORGOT PASSWORD') {
        let template = fs.readFileSync(__dirname + "/../views/admin_reset_password.hjs", 'utf8');
       
        var compiledTemplate = Hogan.compile(template)
        subject = "Grad Stock Forgot Password Link"
        html = compiledTemplate.render({ token:email_detail.token ,username:email_detail.username})
    }
    if (email_detail.template_code == 'REGISTRATION') {
        let template = fs.readFileSync(__dirname + "/../views/registration.hjs", 'utf8');
       
        var compiledTemplate = Hogan.compile(template)
        subject = "Grad stock Registration"
        html = compiledTemplate.render({username:email_detail.username})
    }
    if (email_detail.template_code == 'OTP') {
        let template = fs.readFileSync(__dirname + "/../views/send_otp.hjs", 'utf8');
       
        var compiledTemplate = Hogan.compile(template)
        subject = "Grad stock OTP verification"
        html = compiledTemplate.render({ otp: email_detail.otp,username:email_detail.username })
    }
    if (email_detail.template_code == 'COMPLETE_PROFILE') {
        let template = fs.readFileSync(__dirname + "/../views/send_otp.hjs", 'utf8');
       
        var compiledTemplate = Hogan.compile(template)
        subject = "Grad stock Profile verification"
        html = compiledTemplate.render({ token: email_detail.verify_token,username:email_detail.username })
    }
    if (email_detail.template_code == 'REQUEST_REJECT') {
        let template = fs.readFileSync(__dirname + "/../views/send_otp.hjs", 'utf8');
       
        var compiledTemplate = Hogan.compile(template)
        subject = "Grad stock Request rejection"
        html = compiledTemplate.render({ otp: email_detail.reason,username:email_detail.username })
    }
    const mailData = {
        from: process.env.MAIL_ID,  // sender address
        to: to_email,   // list of receivers
        subject: subject,
        html: html
    };
    transporter.sendMail(mailData, async function (err, info) {
        var responseArr = {};
        if (err) {
            console.log("err>>>>>>>>", err)
            responseArr = {
                "status": false,
                "message": err
            }
            return responseArr;
        }
        console.log(info);
        responseArr = {
            "status": false,
            "message": info
        }
        return responseArr;
    });
}

const isFileValid = (file, accepttype) => {
    let isvalid = true;
    const type = path.extname(file.filename).replace('.', '').toLowerCase();

    let validTypes = [];

    //const validTypes = ["jpg", "jpeg", "png", "pdf"];
    if (accepttype) {
        if (accepttype.includes(','))
            accepttype = accepttype.split(',');

        if (accepttype && Array.isArray(accepttype))
            validTypes = accepttype.map(r => r.replace('.', '').toLowerCase());


        if (accepttype && !Array.isArray(accepttype))
            validTypes.push(accepttype.replace('.', '').toLowerCase());


        // Validate file type
        if (validTypes.indexOf(type) === -1) {
            isvalid = false;
            throw new Error('supported file type is ' + accepttype);

        }
    }
    // Validate file size
    const fileSize = file.size / 1024 / 1024; // in MiB
    if (!(fileSize <= process.env.FILE_MAXSIZE)) {
        isvalid = false;
        throw new Error('max size ' + process.env.FILE_MAXSIZE + 'MB allowed');
    }

    return isvalid;

};

const saveAsFile = (file, savefolder, acceptfiletype) => {

    let uploadPath;
    //if single file
    if (!file.length) {

        // checks if the file is valid
        const isValid = isFileValid(file, acceptfiletype);

        // creates a valid name by removing spaces
        const fileName = encodeURIComponent(file.filename.replace(/\s/g, "-"));

        const uploadfolder = path.join(savefolder);
        // Check if the directory exists
        if (!fs.existsSync(uploadfolder)) {

            // asynchronously create a directory
            fs.mkdir(uploadfolder, (err) => {
                if (err) { throw err };
            })
        }
        uploadPath = path.join(uploadfolder, fileName);
        if (process.env.FILE_UPLOAD_MODE === "COPY") {

            mv(file.path, uploadPath, { mkdirp: true }, (err) => {
                if (err) { throw err };
                console.log("file save successfully!");
                // done. it first created all the necessary directories, and then
                // tried fs.rename, then falls back to using ncp to copy the dir
                // to dest and then rimraf to remove the source dir
            });
        }

        if (process.env.FILE_UPLOAD_MODE === "RENAME") {

            fs.rename(file.path, uploadPath, (err) => {
                if (err) { throw err };
                console.log("file save successfully!");
            });
        }

    }

    return uploadPath;
}
const singleFileRequest = async (files_detail) => {
    return new Promise((resolve, reject) => {
        let files = files_detail.files;
        if (Object.keys(files).length > 0) {
            let openedFiles = files_detail.files;
    
            let oldpath;
            let newpath;
            if (openedFiles.mimetype == 'image/jpeg' || openedFiles.mimetype == 'image/png' || openedFiles.mimetype == 'image/jpg' || openedFiles.mimetype == 'application/pdf') {
                var file_name = Date.now() +"/"+ files.originalFilename;
                // form_datas.comp_incop_certif_url = file_name;
                //  oldpath = openedFiles.filepath;
                //  newpath =_uploadPath() + files_detail.folder_name + '/' + file_name
                //console.log(uploadPath)
                //console.log('oldpath', oldpath)
                //console.log('newpath ', newpath)
                var newName = file_name;
                let bucket = process.env.AWS_S3_BUCKET_NAME;;
                // let bucket = 'credexon-prod';
                let folder_name = files_detail.folder_name;
                uploadToS3(openedFiles, bucket, folder_name, newName)
                    .then(res => {
                        resolve(res);
                    })
                    .catch(err => {
                        console.log({ err })
                    })
                //console.log("fileeeeee",data)
                // fs.rename(oldpath, newpath, function (err) {
                //   console.log('err is aaaa ', err)
                //   if (err) throw err;
                // });
                //console.log("file name isss heregit",file_name);
            } else {
                throw "Doc Format is not correct";
            }
        }
    })
}
const multiplefilerequest = async (files_detail) => {
        let bucket = process.env.AWS_S3_BUCKET_NAME;
        var folderName = files_detail.folder_name
        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        
        if (files_detail) {
          return Promise.all(files_detail.files.map((item)=>{
               // if (item.mimetype == 'image/jpeg' || item.mimetype == 'image/png' || item.mimetype == 'image/jpg' || item.mimetype == 'application/pdf') {
                    if (item.size <= MAX_FILE_SIZE) {
                    } else {
                        throw `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)} MB`;
                        
                    }
                    var file_name = Date.now() + "/" + item.originalFilename;
                    var fileSize = item.size;
                    return new Promise((resolve, reject) => {
                        const s3 = new AWS.S3({
                            region: process.env.AWS_S3_BUCKET_REGION,
                            accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY,
                            secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_KEY,
                            s3BucketEndpoint: false,
                        });
                        
                        const uploadParams = {
                            Bucket: bucket, Key: folderName + file_name, Body: fs.createReadStream(item.filepath),
                            ACL: 'public-read',
                            ContentType: item.mimetype,
                            ContentLength: item.size,
                            Metadata: {
                                filesize: fileSize.toString()
                            }
                        };
                   
                        s3.upload(uploadParams, (err, data) => {
                            if (err) {
                                reject(err)
                            } else if (data) {
                                const s3 = new AWS.S3({
                                    region: process.env.AWS_S3_BUCKET_REGION,
                                    accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY,
                                    secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_KEY,
                                    s3BucketEndpoint: false,
                                });
      
                                const getObjectParams = {
                                    Bucket: bucket,
                                    Key: data.Key
                                };
      
                                s3.headObject(getObjectParams, (err, metadata) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        const fileSizeInBytes = metadata.ContentLength;
                                        resolve({...data, fileSizeInBytes, originalFilename: item.originalFilename});
                                    }
                                });
                            }
                        });
                    });
                // } else {
                //     throw "Doc Format is not correct";
                // }
            }))
        }
}
const convertedfil = async (files_detail) => {
    let bucket = process.env.AWS_S3_BUCKET_NAME;
    var folderName = files_detail.folder_name
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    
    if (files_detail) {
      return Promise.all(files_detail.files.map((item)=>{
           // if (item.mimetype == 'image/jpeg' || item.mimetype == 'image/png' || item.mimetype == 'image/jpg' || item.mimetype == 'application/pdf') {
                if (item.size <= MAX_FILE_SIZE) {
                } else {
                    throw `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)} MB`;
                    
                }
                var file_name = Date.now() + "/" + item.originalFilename;
                var fileSize = item.size;
                return new Promise((resolve, reject) => {
                    const s3 = new AWS.S3({
                        region: process.env.AWS_S3_BUCKET_REGION,
                        accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY,
                        secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_KEY,
                        s3BucketEndpoint: false,
                    });
                    
                    const uploadParams = {
                        Bucket: bucket, Key: folderName + file_name, Body: fs.createReadStream(item.filepath),
                        ACL: 'public-read',
                        ContentType: item.mimetype,
                        ContentLength: item.size,
                        Metadata: {
                            filesize: fileSize.toString()
                        }
                    };
               
                    s3.upload(uploadParams, (err, data) => {
                        if (err) {
                            reject(err)
                        } else if (data) {
                            const s3 = new AWS.S3({
                                region: process.env.AWS_S3_BUCKET_REGION,
                                accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY,
                                secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_KEY,
                                s3BucketEndpoint: false,
                            });
  
                            const getObjectParams = {
                                Bucket: bucket,
                                Key: data.Key
                            };
  
                            s3.headObject(getObjectParams, (err, metadata) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    const fileSizeInBytes = metadata.ContentLength;
                                    resolve({...data, fileSizeInBytes, originalFilename: item.originalFilename});
                                }
                            });
                        }
                    });

                    // Use LibreOffice to convert the uploaded file to JPEG
                    exec('/full/path/to/libreoffice --headless --convert-to jpg --outdir /full/path/to/uploads /full/path/to/uploads/' + file_name, (error, stdout, stderr) => {
                        if (error) {
                        console.error(`Error: ${error}`);
                        return res.status(500).json({ error: 'Conversion failed' });
                        }
                
                        // Read the converted image from the local filesystem
                        const filePath = __dirname + `/uploads/${file_name}.jpg`;
                        const fileContent = require('fs').readFileSync(filePath);

                        const convertuploadParams = {
                            Bucket: bucket, Key: folderName + file_name, Body: fileContent,
                            ACL: 'public-read',
                            ContentType: item.mimetype,
                            ContentLength: item.size,
                            Metadata: {
                                filesize: fileSize.toString()
                            }
                        };

                        s3.upload(convertuploadParams, (err, data) => {
                            if (err) {
                                reject(err)
                            } else if (data) {
                                const s3 = new AWS.S3({
                                    region: process.env.AWS_S3_BUCKET_REGION,
                                    accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY,
                                    secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_KEY,
                                    s3BucketEndpoint: false,
                                });
      
                                const getObjectParams = {
                                    Bucket: bucket,
                                    Key: data.Key
                                };
      
                                s3.headObject(getObjectParams, (err, metadata) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        const fileSizeInBytes = metadata.ContentLength;
                                        resolve({...data, fileSizeInBytes, originalFilename: item.originalFilename});
                                    }
                                });
                            }
                        });
  
                });
            // } else {
            //     throw "Doc Format is not correct";
            // }
        })
    }))
}
}
const uploadToS3 = async (file, bucket, folder_name, file_name) => {
    // console.log('file', file);
    return new Promise((resolve, reject) => {
        const s3 = new AWS.S3({
            //   apiVersion: `${env.apiVersion}`,
            //   version: `${env.version}`,
            region: process.env.AWS_S3_BUCKET_REGION,
            accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY,
            secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_KEY,
            s3BucketEndpoint: false,

        });
        // console.log('file', file.type)
        const uploadParams = {
            Bucket: bucket, Key: '', Body: '',
            ACL: 'public-read',
            ContentType: file.mimetype
        };
        // console.log('uploadParams', uploadParams)
        const filename = file_name;
        let fileStream = fs.createReadStream(file.filepath);
        // console.log('filestream', fileStream)
        fileStream.on('error', (err) => {
        });
        uploadParams.Body = fileStream;
        uploadParams.Key = folder_name + filename;
        //console.log('upload params', uploadParams)
        // call S3 to retrieve upload file to specified bucket
        //  console.log("uploadParam",uploadParams)
        s3.upload(uploadParams, (err, data) => {
            if (err) {
                //console.log('daat err ', err)
                reject(err);
            } else if (data) {
                resolve(data);
            }
        });
        // resolve("done");
    });
}

const getAuthUserId = function(request){
    var user_id = "";
    if (request.headers && request.headers.authorization && request.headers.authorization.split(' ')[0] === 'Bearer') {
        jwtToken.verify(request.headers.authorization.split(' ')[1], secret, function (err, decode) {
            if(err){
                request.user = undefined;
            }
            user_id = decode.sub;
        });
    }
    return user_id;
}

module.exports = { response, error, sendmails, saveAsFile, singleFileRequest ,multiplefilerequest,getAuthUserId,convertedfil};
