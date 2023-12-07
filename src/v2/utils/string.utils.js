const strRemoveUnicode = (string) => {
    return string.replace(/[\x00-\x08\x0E-\x1F\x7F-\uFFFF]/g, '');
};

function stringToSlug(str, option = 0) {
    var from, to;
    // remove all marks (Latin alphabet)
    if (option === 0) {
        from =
            'àáãảạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđùúủũụưừứửữựòóỏõọôồốổỗộơờớởỡợìíỉĩịäëïîöüûñçýỳỹỵỷ';
        to =
            'aaaaaaaaaaaaaaaaaeeeeeeeeeeeduuuuuuuuuuuoooooooooooooooooiiiiiaeiiouuncyyyyy';
    }

    //remove tone mark (Vietnamese alphabet)
    if (option === 1) {
        from =
            'àáãảạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđùúủũụưừứửữựòóỏõọôồốổỗộơờớởỡợìíỉĩịäëïîöüûñçýỳỹỵỷ';
        to =
            'aaaaaăăăăăăââââââeeeeeêêêêêêđuuuuuưưưưưưoooooôôôôôôơơơơơơiiiiiaeiiouuncyyyyy';
    }

    for (var i = 0, l = from.length; i < l; i++) {
        str = str.replace(RegExp(from[i], 'gi'), to[i]);
    }

    str = str
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\-]/g, '-')
        .replace(/-+/g, '-');
    return str;
}
module.exports = { strRemoveUnicode, stringToSlug };
