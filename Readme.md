# Express with typescript openid

Manage auth with openid server

## Stack

Node + Typescript + Express

## Required

### SSL certificate for Https

Use `mkcert` tool

See installation on [mkcert github page](https://github.com/FiloSottile/mkcert)

Move to `certificates` directory

```bash
cd certificates
```

Create local Certificate Authority

```bash
mkcert -install
```

Generate signed certificate for domain

```bash
mkcert "auth.myproject.local"
```

```bash
mkdir certificates
cp auth.myproject.local* ./certificates
```

Resolve your deomain to local, edit `/etc/hosts`

```
127.0.0.1 auth.myproject.local
```

### Define your own env file

```bash
cp .env.template .env
```

### Dependencies

Install packages

```bash
npm ci
```

packages global or local

-   typescript
-   ts-node

Packages :

-   [express](https://www.npmjs.com/package/express) : framework
-   [dotenv](https://www.npmjs.com/package/dotenv): env config loader
-   [body-parser](https://www.npmjs.com/package/body-parser) : parse body middleware
-   [cors](https://www.npmjs.com/package/cors)
-   [helmet](https://www.npmjs.com/package/helmet) : security middleware
-   [morgan](https://www.npmjs.com/package/morgan) : logger middleware

Conventions

-   tslint
-   prettier

Log

-   [pino](https://getpino.io/#/)

Testing

-   [jest](https://jestjs.io/)

### Keycloak

Launch keycloak server : http://locahost:8080

```bash
docker-compose up
```

admin credentials (defined in docker-compose.yml)

```bash
admin
admin
```

#### Config

-   realm : create realm with openid connect
-   client > settings : ensure standard flow and direct grant selected
-   roles > create role 'user'
-   client scope: create scope 'skills' (disable consent)
-   client > scopes : add 'skills' to default scope selected

Do not use Implicit Flow (deprecated) but Authorization Code Grant Flow with PKCE

[Video about PKCE flow](https://www.youtube.com/watch?v=CHzERullHe8)

JSON Web Keys(JWKs) returned by authorization server endpoint

```bash
http://localhost:8080/realms/myrealm/protocol/openid-connect/certs
```

All URL configured here:

http://localhost:8080/realms/myrealm/.well-known/openid-configuration

#### Authorization Code Grant Flow with PKCE

ref : https://auth0.com/docs/api-auth/tutorials/authorization-code-grant-pkce

-   create code verifier
-   create code challenge from verifier
-   Get the User's Authorization with code challenge
-   Exchange the Authorization Code for an Access Token
-   Call the API with Bearer :)
-   verify token (JWT, claims, perms)

Infos :

-   store verify code with state in cookie
-   use cookie-parser middleware to retrieve cookie
