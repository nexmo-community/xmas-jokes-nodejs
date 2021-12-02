const Koa = require('koa');
const Router = require('koa-router');
const Vonage = require('@vonage/server-sdk')
const bodyParser = require('koa-bodyparser');
const PORT = process.env.PORT || 3000;
const jokes = require('./src/jokes');

const app = new Koa();
const router = new Router();

app.use(bodyParser());

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGEAPI_SECRET,
  applicationId: process.env.VONAGEAPPLICATION_ID,
  privateKey: process.env.VONAGE_APPLICATION_PRIVATE_KEY
})

const reply = async (number, text) => {
  const lowerText = text.toLowerCase();

  const joke = () => {
    let rand = Math.floor(Math.random() * jokes.length);
    return jokes[rand].line;
  };

  const selectReplyNumber = number => {
    return number.charAt(0) === '1'
      ? process.env.VONAGE_FROM_NUMBER_US
      : process.env.VONAGE_FROM_NUMBER;
  };

  return new Promise((resolve, reject) => {
    if (lowerText === 'awkward' || lowerText === 'more') {
      vonage.message.sendSms(process.env.VONAGE_FROM_NUMBER, to, joke(), (err, responseData) => {
    if (err) {
        console.log(err);
    } else {
        if(responseData.messages[0]['status'] === "0") {
            console.log("Message sent successfully.");
        } else {
            console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
        }
    }
})
      else {
      reject({ sent: false, detail: 'Keyword unknown' });
    }
  });
};

router.post('/inbound', async ctx => {
  const { msisdn, text } = await ctx.request.body;

  reply(msisdn, text)
    .then(res => {
      console.log(res);
      ctx.status = 200;
    })
    .catch(err => {
      console.log(err);
      ctx.status = 200;
    });

  ctx.status = 200;
});

router.post('/status', async ctx => {
  ctx.status = 200;
});

app.use(router.routes());

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
