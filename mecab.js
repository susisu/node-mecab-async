var exec     = require('child_process').exec;
var execSync = require('child_process').execSync;
var sq       = require('shell-quote');

// for backward compatibility
var MeCab = function() {};

MeCab.prototype = {
    command : 'mecab',
    _format: function(arrayResult) {
        var result = [];
        if (!arrayResult) { return result; }
        // Reference: http://mecab.googlecode.com/svn/trunk/mecab/doc/index.html
        // 表層形\t品詞,品詞細分類1,品詞細分類2,品詞細分類3,活用形,活用型,原形,読み,発音
        arrayResult.forEach(function(parsed) {
            if (parsed.length <= 8) { return; }
            result.push({
                kanji         : parsed[0],
                lexical       : parsed[1],
                compound      : parsed[2],
                compound2     : parsed[3],
                compound3     : parsed[4],
                conjugation   : parsed[5],
                inflection    : parsed[6],
                original      : parsed[7],
                reading       : parsed[8],
                pronunciation : parsed[9] || ''
            });
        });
        return result;
    },
    _shellCommand : function(str) {
        return sq.quote(['echo', str]) + ' | ' + this.command;
    },
    _parseMeCabResult : function(result) {
        return result.split('\n').map(function(line) {
            var arr = line.split('\t');
            // EOS
            if (arr.length === 1) {
                return [line];
            }
            return [arr[0]].concat(arr[1].split(','));
        });
    },
    parse : function(str, callback) {
        var self = this;
        process.nextTick(function() { // for bug
            exec(self._shellCommand(str), function(err, result) {
                if (err) { return callback(err); }
                callback(err, self._parseMeCabResult(result).slice(0,-2));
            });
        });
    },
    parseSync : function(str) {
        var result = execSync(this._shellCommand(str));
        return this._parseMeCabResult(String(result)).slice(0, -2);
    },
    parseFormat : function(str, callback) {
        var self = this;
        this.parse(str, function(err, result) {
            if (err) { return callback(err); }
            callback(err, self._format(result));
        });
    },
    parseSyncFormat : function(str) {
        return this._format(this.parseSync(str));
    },
    _wakatsu : function(arr) {
        return arr.map(function(data) { return data[0]; });
    },
    wakachi : function(str, callback) {
        var self = this;
        this.parse(str, function(err, arr) {
            if (err) { return callback(err); }
            callback(null, self._wakatsu(arr));
        });
    },
    wakachiSync : function(str) {
        var arr = this.parseSync(str);
        return this._wakatsu(arr);
    }
};

for (var x in MeCab.prototype) {
    MeCab[x] = MeCab.prototype[x];
}

module.exports = MeCab;
