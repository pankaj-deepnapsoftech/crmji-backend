const axios = require("axios");

const fetchImage = async (src) => {
    const image = await axios.get(src, {
      responseType: "arraybuffer",
    });
    return image.data;
};

module.exports = { fetchImage };
