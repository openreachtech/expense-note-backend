# renchan-boilerplate

A running skeleton for a [renchan](https://github.com/openreachtech/renchan) application — GraphQL and RESTful API endpoints, and Sequelize, already wired together.

## Table of contents

- [Concept](#concept)
- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
- [How the session tokens work](#how-the-session-tokens-work)
- [Contribution](#contribution)
- [License](#license)
- [Developer](#developer)
- [Copyright](#copyright)

## Concept

renchan is an Express-based framework that builds GraphQL and RESTful API endpoints from template classes. This repository is the starting point for an application built on it.

It is not an empty directory. Clone it, install, and the boilerplate's own servers already listen, each answering a `healthCheck` query; Sequelize already activates against SQLite; and the classes that hold a session's access and refresh tokens are already written. What is left is the application's own schema, resolvers and models.

## Installation

Requires Node.js LTS (the version the CI builds against).

A boilerplate is cloned, not installed as a package.

```sh
git clone https://github.com/openreachtech/renchan-boilerplate.git <your-project>
cd <your-project>
npm install
npm run db:refresh
npm run dev
```

`package.json` ships `name`, `version` and `description` as `TODO` placeholders — fill them in first.

The project is an ES module (`"type": "module"`); write imports with ESM `import` syntax.

## Usage

### The servers

`server/index.js` starts every one of them by hand — there is no scanning — each on its own port.

| server | port | endpoint | engine | health check |
| :-- | :-- | :-- | :-- | :-- |
| GraphQL for staff | 4900 | `/graphql-staff` | `StaffGraphqlServerEngine` | **no** |
| GraphQL for customers | 3900 | `/graphql-customer` | `CustomerGraphqlServerEngine` | yes |
| GraphQL for admins | 5800 | `/graphql-admin` | `AdminGraphqlServerEngine` | yes |
| RESTful API | 8001 | `/v1` | `AppRestfulApiServerEngine` | — |

**The staff audience is this product's own; the other three ship with the boilerplate.** The spec declares one server, `staff-graphql`, and the operations it serves are the complete list — which is why it is also the one GraphQL endpoint that answers **no** health check. A fully public operation nobody declared would falsify the spec's rule that every operation authenticates by one of two credentials, so the absence is deliberate. **Do not add one.**

Every server binds to `127.0.0.1` alone. They are meant to sit behind a reverse proxy, so no other network interface accepts a connection.

```sh
curl -X POST http://127.0.0.1:3900/graphql-customer \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ healthCheck }"}'
```

In production the servers run under PM2, whose configuration is `pm2.config.cjs`.

### Commands

| command | what it does |
| :-- | :-- |
| `npm run dev` | run `server/` under nodemon with `NODE_ENV=development` |
| `npm test` | rebuild the database, seed it, and run Jest (`test.sh`) |
| `npm run test:live` | run Jest against the `live` environment, leaving the database alone (`test-live.sh`) |
| `npm run lint` | ESLint over the repository (alias: `npm run l`) |
| `npm run db:setup` | run the migrations |
| `npm run db:seed:master` | seed `sequelize/seeders/dev-master/` |
| `npm run db:seed:dev` | seed `sequelize/seeders/development/` |
| `npm run db:teardown` | delete the SQLite files under `sequelize/storage/` (alias: `npm run db:drop`) |
| `npm run db:refresh` | teardown, migrate, then both seed sets (alias: `npm run r`) |

`npm test` takes the same arguments as Jest, plus `--empty` to run only against the master seeds and `--seeded` to run against the development seeds as well.

```sh
npm test tests/__tests__/server/graphql/
npm test -- --empty
```

`sequelize/seeders/master/` holds the seeds meant for a real deployment. No script points at it — it is seeded deliberately, by hand.

### Where the application code goes

```
├── app/                    # code every server shares
│   ├── constants/          # constants, re-exported to ESM
│   ├── globals/            # env facade, root path, CJS require
│   └── session/            # access and refresh tokens
├── constants/              # constants, written as CJS
├── public/                 # static files the servers serve
├── sequelize/
│   ├── config.cjs          # connection settings, per NODE_ENV
│   ├── migrations/         # write the migrations here
│   ├── models/             # write the models here
│   └── seeders/            # master, dev-master, development
├── server/
│   ├── graphql/
│   │   ├── contexts/       # context and share, per audience
│   │   ├── resolvers/      # write the resolvers here
│   │   ├── schemas/        # write the GraphQL schemas here
│   │   └── *ServerEngine.js
│   ├── restfulapi/
│   │   ├── renderers/      # write the renderers here
│   │   └── AppRestfulApiServerEngine.js
│   └── index.js            # every server and its port
├── tests/                  # Jest tests
└── types/                  # ambient type declarations
```

Some places are marked in the code as waiting for the application — `git grep 'TODO: Must fulfill'` lists every one, including any audience added since.

| what | where |
| :-- | :-- |
| how the signed-in user is found | `CustomerGraphqlContext.findUser()`, `AdminGraphqlContext.findUser()`, `AppRestfulApiContext.findUser()` |
| which schema fields a user may reach | `#get:visaIssuers` of each engine |
| the package's own identity | `name`, `version`, `description` of `package.json` |

### Resolvers, actual and stub

Each GraphQL engine declares two resolver directories, and a schema field is served by its actual resolver where one exists, by the stub otherwise.

```
server/graphql/resolvers/customer/
├── actual/          # the real implementation
│   ├── queries/
│   └── mutations/
└── stub/            # answers until the actual one is written
    ├── queries/
    └── mutations/
```

A stub lets the frontend develop against a field before its query is implemented. Note that the authentication filter is built from the actual resolvers alone, so a field served by a stub is reached without it.

### Environment variables

Variables are read through `@openreachtech/renchan-env`, which loads the dotenv file named after `NODE_ENV` from the repository root — so `NODE_ENV=development` reads the development one. Under `NODE_ENV=production` no file is read at all, and the process environment is the only source.

| variable | what it decides | default |
| :-- | :-- | :-- |
| `AUTH_REFRESH_TOKEN_TTL_DAYS` | how long the refresh-token cookie lives, in days | 14 |
| `AUTH_COOKIE_SECURE` | whether that cookie carries `Secure`; only the exact string `false` turns it off | on |
| `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_DIALECT`, `DATABASE_HOST`, `DATABASE_PORT` | the production connection in `sequelize/config.cjs` | — |

### Database

`sequelize/config.cjs` carries one entry per `NODE_ENV`: `development` on SQLite in `sequelize/storage/`, `live` and `staging` on MariaDB and MySQL, and `production` built from the variables above.

Development runs on a file, which is why `npm run db:refresh` can throw the database away and rebuild it in one step.

#### Verifying against the real dialect

**A migration can pass every local check and still be wrong.** `development` runs on SQLite, which
reads a `bigint` primary key back as `INTEGER`, every `datetime(3)` as a bare `DATETIME`, and is lax
about `varchar(191)` — so the column types section 9 of the spec declares are never exercised by a
development run or by `npm test`. The MariaDB container exists for exactly this.

```bash
./docker.sh start          # MariaDB 10.5.12 on 127.0.0.1:3306, the version CI pins
npm run db:refresh:live    # unwind, migrate and seed it, against NODE_ENV=live
./docker.sh stop
```

`db:refresh:live` is the `live` counterpart of `db:refresh`. It differs in one way that matters:
**MariaDB cannot be torn down by deleting a file**, so `db:teardown:live` unwinds the schema with
`db:migrate:undo:all` rather than `rm`. Re-running the seeders without that step fails on a duplicate
primary key — sequelize-cli's seeder storage here is `none`, so every seeder re-runs on every
invocation.

**What it leaves you to look at**, counted against the container rather than from memory:

| table | rows |
| :-- | --: |
| `staff_members` | 13 |
| `staff_member_secrets` | 11 |
| `staff_member_password_hashes` | 11 |
| `expense_categories` | 4 (master) |

**Ten of the thirteen can actually sign in.** Signing in needs both halves — the address to be found
by, and the digest to compare against — so the count that matters is the join, not either table's
row count. Three members of staff are deliberately short of one: **one has an address and no digest,
one has a digest and no address, and one has neither.** Accounts are issued by hand outside the
product (§4), so a half-issued one is the likeliest way one goes wrong, and §10's identical-refusal
criterion needs a row to test against.

`expenses` seeds **no rows** — `sequelize/seeders/development/` holds only the three staff-account
seeders, and expenses arrive with `#expense-entry`.

The plaintext passwords are in the password-hash seeder beside each digest.

> **Note for Windows.** Both `db:refresh` and `db:refresh:live` begin with `export`, which npm runs
> through `cmd.exe` on Windows, where it is not a command. Run the four steps individually with
> `NODE_ENV` set in the environment instead. This is a pre-existing property of `db:refresh`, not
> something the `:live` variant introduced.

## API

Class members are written with the following notation.

| notation | members |
| :-- | :-- |
| `#instanceProperty` | instance property |
| `#instanceMethod()` | instance method |
| `#get:instanceGetter` | instance getter |
| `#set:instanceSetter` | instance setter |
| `.staticProperty` | static property |
| `.staticMethod()` | static method |
| `.get:staticGetter` | static getter |
| `.set:staticSetter` | static setter |

### `SessionClerk`

The single window onto a session's data — every read and write across the tables a session is made of. Callers depend on this class and never touch the tables themselves.

| member | description |
| :-- | :-- |
| `.create()` | Build a clerk over the access-token and refresh-token models it is given |
| `#saveSession()` | Start a session, and return its first token pair |
| `#findRefreshToken()` | Find the row a presented refresh token belongs to |
| `#rotateSession()` | Spend the presented refresh token and issue the next pair in the same series |
| `#revokeSession()` | Revoke a whole series, and report how much it removed |

The models are injected rather than imported, so every audience shares one implementation.

```js
const sessionClerk = SessionClerk.create({
  AccessTokenModel,
  RefreshTokenModel,
})

const savingResult = await sessionClerk.saveSession({
  userId,
  now: new Date(),
})

if (savingResult.hasError()) {
  // the transaction was rolled back
}

const credentialPair = savingResult.credentialPair
```

No write throws at its caller. Each opens its own transaction and reports the outcome as a result object — `#hasError()` on failure, the payload on success — so a throw inside rolls the transaction back and arrives as `#error`. Naming the error is left to the resolver.

`sequelize/models/` ships empty, so the two models are the application's own.

## How the session tokens work

A session is a pair of tokens, minted from `crypto.randomBytes()` rather than from `Math.random()` — the latter is a deterministic sequence, so observing enough tokens narrows down the ones that come next.

The two halves are stored differently. A refresh token is stored as a SHA-256 digest, because it is the long-lived half and a leaked dump would otherwise be a set of working sessions; the lookup hashes what arrives and matches on that. An access token is stored as it is, since it expires in minutes and hashing it would cost a digest on every single request.

The refresh token reaches the browser as an `HttpOnly` cookie, and each audience holds its own under its own name, declared in `constants/authConstants.cjs`, scoped to that audience's endpoint path — so one audience's cookie is never even sent to another's endpoint. The cookie names no domain, on purpose: naming one widens the cookie to every subdomain, and one XSS on any of them would reach it.

The cookie's configuration lives in `BaseAppGraphqlServerEngine`, and the cookie itself is written through `RefreshTokenExpressCookieClerk` — a resolver that manages a session builds one from its context, and every other resolver never touches the cookie.

## Contribution

Bug reports, feature requests, and code contributions are welcome.

Feel free to contact us through GitHub Issues.

```sh
git clone https://github.com/openreachtech/renchan-boilerplate.git
cd renchan-boilerplate
npm install
npm run lint
npm test
```

## License

This project is released under the Apache License 2.0.

For more details, please see [in the LICENSE file](./LICENSE).

## Developer

[Open Reach Tech Inc.](https://openreach.tech)

## Copyright

© 2026 Open Reach Tech Inc.
