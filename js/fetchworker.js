/* -*- mode: javascript; c-basic-offset: 4; indent-tabs-mode: nil -*- */

// 
// Dalliance Genome Explorer
// (c) Thomas Down 2006-2014
//
// fetchworker.js
//

importScripts('bin.js', 'bam.js', '../jszlib/js/inflate.js')

var connections = {};

(function(global) {
    var idSeed = 0;

    global.newID = function() {
        return 'cn' + (++idSeed);
    }
}(self));

onmessage = function(event) {
    var d = event.data;
    var command = event.data.command;
    var tag = event.data.tag;

    if (command === 'connectBAM') {
        var id = newID();

        var bam, bai;
        if (d.blob) {
            bam = new BlobFetchable(d.blob);
            bai = new BlobFetchable(d.indexBlob);
        } else {
            bam = new URLFetchable(d.uri);
            bai = new URLFetchable(d.indexUri);
        }

        makeBam(bam, bai, function(bam, err) {
            if (bam) {
                connections[id] = new BAMWorkerFetcher(bam);
                postMessage({tag: tag, result: id});
            } else {
                postMessage({tag: tag, error: err || "Couldn't fetch BAM"});
            }
        });
    } else if (command === 'fetch') {
        var con = connections[event.data.connection];
        if (!con) {
            return postMessage({tag: tag, error: 'No such connection: ' + event.data.connection});
        }

        con.fetch(d.tag, d.chr, d.min, d.max);
    } else if (command === 'date') {
        return postMessage({tag: tag, result: Date.now()|0});
    } else {
        postMessage({tag: tag, error: 'Bad command ' + command});
    }
}

function BAMWorkerFetcher(bam) {
    this.bam = bam;

}

BAMWorkerFetcher.prototype.fetch = function(tag, chr, min, max) {
    this.bam.fetch(chr, min, max, function(records, err) {
        if (records) {
            postMessage({tag: tag, result: records, time: Date.now()|0});
        } else {
            postMessage({tag: tag, error: err});
        }
    });
}