const axios = require("axios");

const sendOtp = async (phone, otp) => {
  // setting state
  let isSent = false;

  // url to send otp
  const url = "https://api.managepoint.co/api/sms/send";

  // payload to send
  const payload = {
    apiKey: "8e9c8a05-a0fd-4543-a969-2cc765fe5aae",
    to: phone,
    message: `Your OTP for the chat application is ${otp}`,
  };

  try {
    const response = await axios.post(url, payload);
    if (response.status === 200) {
      isSent = true;
    }
  } catch (error) {
    console.log("Error in sending OTP", error.message);
  }
  return isSent;
};
module.exports = sendOtp;