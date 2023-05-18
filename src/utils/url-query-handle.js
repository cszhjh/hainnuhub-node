const getQueryString = (url, key) => {
  var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)", "i");

  var result = url.substring(1).match(reg);

  if (result != null) {
    return decodeURI(result[2]);
  }

  return null;
};

module.exports = getQueryString;
