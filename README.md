# cognito-srp-browser-client package

Amazon Cognito Secure Remote Password client protocol for browsers.

This package is designed to be used on a modern web browser, primarily to provide SRP for the SDK v3
[@aws-sdk/client-cognito-identity-provider](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/cognito-identity-provider/)
package.

SubtleCrypto is used for cryptography. It is only available in secure (e.g. https://) contexts, and
so this package will not work otherwise. Note that for development, Chrome considers http://localhost
as secure.

This works for me, but your mileage may vary.

## History

This package is forked from [cognito-srp](https://github.com/sjmeverett/cognito-srp/). It has been
updated to work on modern browsers natively, without the need for node.js polyfills. The cognito-srp
package provides server functionality which has been stripped out of this package.

The original cognito-srp package borrows heavily from the [srp-js](https://www.npmjs.com/package/srp-js) package, but implements a slight variant of the protocol in order to work with Amazon Cognito. Also
inspired by bits from [amazon-cognito-identity-js](http://www.npmjs.com/package/amazon-cognito-identity-js), the official client library.

## Usage

First, install:

```
yarn add cognito-srp-browser-client
```

Then import. Your starting point will usually be the `UserPool` class:

```js
import { UserPool } from ' cognito-srp-browser-client';
```

Instantiate a pool, using your pool name:

```js
const userPool = new UserPool('7DZy4Fkn7');
```

Note that the pool name here is not the full `UserPoolId` that the AWS SDK asks for, i.e.:

```js
const UserPoolId = 'us-east-2_7DZy4Fkn7';
const poolname = UserPoolId.split('_')[1];
```

Once the user has entered their username and password, you can create a challenge:

```js
const challenge = await userPool.getClientChallenge({ username, password });
```

You can then make a request to the server with the user's username and a client key (`A`):

```js
const A = challenge.calculateA();
```

The server will respond with the server key (`B`), the user's salt, and a secret block.
The client can then create a session:

```js
const session = await challenge.getSession(B, salt);
```

This can optionally include a change of username, for example where initial login uses the
user's e-mail address.

Then, the client can calculate the signature as proof that it knows the password:

```js
const timestamp = getTimestamp();
const signature = await session.calculateSignature(secretBlock, timestamp);
```

The client sends the secret block, timestamp and signature back to the server, and its
identity is established.

## Sample using @aws-sdk/client-cognito-identity-provider

```js
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { UserPool } from 'cognito-srp-browser-client';

[...]

const cognitoClient = new CognitoIdentityProviderClient({ region: cognitoRegion });
const srpUserPool = new UserPool(cognitoPoolId);

const challenge = await srpUserPool.getClientChallenge({ email, password });

const response = await cognitoClient.send(
  new InitiateAuthCommand({
    AuthFlow: 'USER_SRP_AUTH',
    AuthParameters: {
      USERNAME: email,
      SRP_A: challenge.getAString(),
    },
    ClientId: cognitoClientId,
  })
);

if (response.ChallengeName === 'PASSWORD_VERIFIER') {
  const session = await challenge.getSession(
    response.ChallengeParameters.SRP_B,
    response.ChallengeParameters.SALT,
    response.ChallengeParameters.USER_ID_FOR_SRP
  );

  const timestamp = getTimestamp();
  const signature = await session.calculateSignature(
    response.ChallengeParameters.SECRET_BLOCK,
    timestamp
  );

  const response2 = await cognitoClient.send(
    new RespondToAuthChallengeCommand({
      ChallengeName: 'PASSWORD_VERIFIER',
      ChallengeResponses: {
        PASSWORD_CLAIM_SIGNATURE: signature,
        PASSWORD_CLAIM_SECRET_BLOCK: response.ChallengeParameters.SECRET_BLOCK,
        TIMESTAMP: timestamp,
        USERNAME: response.ChallengeParameters.USER_ID_FOR_SRP,
      },
      ClientId: cognitoClientId,
    })
  );
}

```

## Notes

The exact format of the requests and responses to Amazon Cognito is outside the scope of this
package &ndash; it only implements the SRP stuff, and you can wrap it in whatever protocol you want.

Although this library is compatible with Cognito and therefore successfully implements the Secure
Remote Password protocol, I'm not a security expert, and I don't claim to understand the maths
behind it &ndash; keep that in mind before you use it for something important.
