"use strict";
var _ = require('lodash');
var fs = require('fs');
var csv = require('csv');
var SEPARATOR = ' ';

module.exports = function (dictionaryPath) {
    var self = this;

    var parseDictionary = function (cb) {
        fs.readFile(self.dictionaryPath, function (err, dictionaryFile) {
            if (err) return cb(err);
            csv.parse(dictionaryFile, function (err, dictionary) {
                if (err) return cb(err);
                cb(null, dictionary);
            });
        });
    };

    var loadDictionary = function (cb) {
        if (self.dictionary) {
            parseDictionary(function (err, parsedDictionary) {
                if (err) return cb(err);
                self.dictionary = parsedDictionary;
                return cb(null, self.dictionary);
            });
        } else {
            return cb(null, self.dictionary);
        }
    };

    var splitByTwoWords = function (words) {
        var splitWords = words.split(SEPARATOR);
        var splitByTwoWords = [];
        for (var i = 0; i < splitWords.length - 1; i++) {
            splitByTwoWords.push([splitWords[i], splitWords[i + 1]].join(' '));
        }
        return splitByTwoWords;
    };

    var split = function (words) {
        return words.split(SEPARATOR).concat(splitByTwoWords(words));
    };

    var deduplicate = function (words) {
        var dedupWords = words.slice();
        _.each(words, function (word) {
            _.each(dedupWords, function (dedupWord) {
                if (_.includes(word, dedupWord)) {
                    if (!_.isEqual(word, dedupWord)) {
                        dedupWords = _.without(dedupWords, dedupWord);
                    }
                }
            });
        });
        return dedupWords;
    };

    this.dictionaryPath = dictionaryPath;
    this.dictionary = [];
    this.synonymize = function (words, cb) {
        var synonymized = [];
        loadDictionary(function (err, dictionary) {
            if (err) return cb(err);
            _.each(dictionary, function (synonyms) {
                var index = synonyms[0];
                _.each(synonyms, function (synonym) {
                    var splitWords = split(words);
                    _.each(splitWords, function (splitWord) {
                        if (_.isEqual(splitWord, synonym)) {
                            synonymized.push(index);
                            return false;
                        }
                    });
                });
            });
            cb(null, deduplicate(synonymized).join(SEPARATOR));
        });
    };

    return this;
};