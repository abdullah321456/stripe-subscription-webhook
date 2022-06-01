const moment=require('moment');
const getSubscriptionTrialPeriod=moment(new Date()).add(2,"minutes");
const getDefaultPriceId="price_1KzbbIFJ50BG2GSlmuIoyZ2M";
const getCurrentDate=moment().toDate();
const getSubscriptionExpireDate=moment(new Date()).add(2,"minutes").toDate();
module.exports={
  getSubscriptionTrialPeriod,
  getDefaultPriceId,
  getCurrentDate,
  getSubscriptionExpireDate
}

