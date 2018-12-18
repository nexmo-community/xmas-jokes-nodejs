const Koa = require('koa');
const Router = require('koa-router');
const Nexmo = require('nexmo');
const bodyParser = require('koa-bodyparser');
const PORT = process.env.PORT || 3000;
const jokes = require('./src/jokes');

const app = new Koa();
const router = new Router();

app.use(bodyParser());

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const nexmo = new Nexmo({
  apiKey: process.env.NEXMO_API_KEY,
  apiSecret: process.env.NEXMO_API_SECRET,
  applicationId: process.env.NEXMO_APPLICATION_ID,
  privateKey: process.env.NEXMO_APPLICATION_PRIVATE_KEY
});

const reply = async (number, text) => {
  const lowerText = text.toLowerCase();

  const joke = () => {
    let rand = Math.floor(Math.random() * jokes.length);
    return jokes[rand].line;
  };

  const selectReplyNumber = number => {
    return number.charAt(0) === '1'
      ? process.env.NEXMO_FROM_NUMBER_US
      : process.env.NEXMO_FROM_NUMBER;
  };

  return new Promise((resolve, reject) => {
    if (lowerText === 'awkward' || lowerText === 'more') {
      nexmo.channel.send(
        { type: 'sms', number: number },
        { type: 'sms', number: selectReplyNumber() },
        {
          content: {
            type: 'text',
            text: 'Quick, say this: ' + joke()
          }
        },
        (error, data) => {
          if (data) {
            resolve({ sent: true, detail: data });
          } else {
            reject({ sent: false, detail: error });
          }
        }
      );
    } else {
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
