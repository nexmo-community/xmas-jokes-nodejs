const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const Nexmo = require('nexmo');
const PORT = process.env.PORT || 3000;
const DEV = process.env.NODE_ENV !== 'production';
const jokes = require('./src/jokes');

if (DEV) {
  require('dotenv').config();
}

const {
  NEXMO_API_KEY,
  NEXMO_API_SECRET,
  NEXMO_APPLICATION_ID,
  NEXMO_APPLICATION_PRIVATE_KEY,
  NEXMO_FROM_NUMBER
} = process.env;

const app = new Koa();
const router = new Router();

app.use(bodyParser());

const nexmo = new Nexmo({
  apiKey: NEXMO_API_KEY,
  apiSecret: NEXMO_API_SECRET,
  applicationId: NEXMO_APPLICATION_ID,
  privateKey: NEXMO_APPLICATION_PRIVATE_KEY
});

const reply = async (number, text, cb) => {
  const lowerText = text.toLowerCase();

  const joke = () => {
    let rand = Math.floor(Math.random() * jokes.length);
    return jokes[rand].line;
  };

  if (lowerText === 'awkward' || lowerText === 'more') {
    nexmo.channel.send(
      { type: 'sms', number: number },
      { type: 'sms', number: NEXMO_FROM_NUMBER },
      {
        content: {
          type: 'text',
          text: 'Quick, say this: ' + joke()
        }
      },
      (err, data) => {
        if (data) {
          cb({ sent: true, data });
        } else {
          cb({ sent: false, err });
        }
      }
    );
  } else {
    cb({ sent: false, err });
  }
};

router.post('/inbound', async ctx => {
  const { msisdn, text } = await ctx.request.body;

  reply(msisdn, text, response => {
    response.sent
      ? console.log('Message sent')
      : console.log('Message not sent');
  });

  ctx.status = 200;
});

router.post('/status', async ctx => {
  ctx.status = 200;
});

app.use(router.routes());

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
