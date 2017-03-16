let fetch = require('node-fetch');
let fs = require('fs');
let path = require('path');

function getFileName(url) {
    url = url.substring(0, (url.indexOf('#') == -1) ? url.length : url.indexOf('#'));
    url = url.substring(0, (url.indexOf('?') == -1) ? url.length : url.indexOf('?'));
    url = url.substring(0, (url.indexOf('.') == -1) ? url.length : url.lastIndexOf('.'));
    url = url.substring(url.lastIndexOf('/') + 1, url.length);
    return url;
}

function getFileExt(fileName) {
    return fileName.slice((fileName.lastIndexOf(".") - 1 >>> 0) + 2);
}

function getFullFilePath(name, ext, dir) {
    if (!name) throw new Error('name is required');
    let path = name;
    if (ext) path += '.' + ext;
    if (dir) path = dir + '/' + path;
    return path;
}

const mkdirp = (dir) => {
    return new Promise((resolve, reject) => {
        let dirname;

        if (fs.existsSync(dir)) {
            resolve(dir);
            return;
        }

        dirname = path.dirname(dir);

        if (!fs.existsSync(dirname)) {
            mkdirp(dirname);
        }

        fs.mkdir(dir, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(dir);
            }
        });
    })
};

const writeFile = (res, dest, options) => {
    return new Promise((resolve, reject) => {
        let fileStream = fs.createWriteStream(dest, options);

        fileStream.on('open', () => {
            res.body.pipe(fileStream);
        }).on('error', (err) => {
            reject(err);
        }).on('finish', () => {
            resolve(dest);
        })
    });
};

const download = (options) => {
    return mkdirp(options.dir)
        .then((dir) => {
            return fetch(options.url)
                .then((res) => {
                    let parsedPath = path.parse(options.url);
                    let dest = path.join(dir, parsedPath.base);

                    return writeFile(res, dest, {flags: 'w+'});
                });
        })
        .then((filePath) => {
            return filePath;
        }).catch((err) => {
            console.log(err);
        })
};

module.exports = download;