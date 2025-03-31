[**OpenAPI Tools v0.1.0**](../../../README.md)

***

[OpenAPI Tools](../../../modules.md) / [common/src](../README.md) / HttpClient

# Interface: HttpClient

Defined in: [common/src/http/core/http-types.ts:39](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/common/src/http/core/http-types.ts#L39)

HTTP client interface abstraction

## Methods

### addRequestInterceptor()

> **addRequestInterceptor**(`onFulfilled`, `onRejected`?): `number`

Defined in: [common/src/http/core/http-types.ts:73](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/common/src/http/core/http-types.ts#L73)

Add interceptor to modify requests before they are sent

#### Parameters

##### onFulfilled

(`config`) => [`RequestOptions`](RequestOptions.md) \| `Promise`\<[`RequestOptions`](RequestOptions.md)\>

##### onRejected?

(`error`) => `unknown`

#### Returns

`number`

***

### addResponseInterceptor()

> **addResponseInterceptor**(`onFulfilled`, `onRejected`?): `number`

Defined in: [common/src/http/core/http-types.ts:81](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/common/src/http/core/http-types.ts#L81)

Add interceptor to modify responses before they are returned

#### Parameters

##### onFulfilled

(`response`) => [`HttpResponse`](HttpResponse.md)\<`unknown`\> \| `Promise`\<[`HttpResponse`](HttpResponse.md)\<`unknown`\>\>

##### onRejected?

(`error`) => `unknown`

#### Returns

`number`

***

### delete()

> **delete**\<`T`\>(`url`, `config`?): `Promise`\<[`HttpResponse`](HttpResponse.md)\<`T`\>\>

Defined in: [common/src/http/core/http-types.ts:59](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/common/src/http/core/http-types.ts#L59)

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### url

`string`

##### config?

`Omit`\<[`RequestOptions`](RequestOptions.md), `"url"` \| `"method"`\>

#### Returns

`Promise`\<[`HttpResponse`](HttpResponse.md)\<`T`\>\>

***

### get()

> **get**\<`T`\>(`url`, `config`?): `Promise`\<[`HttpResponse`](HttpResponse.md)\<`T`\>\>

Defined in: [common/src/http/core/http-types.ts:42](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/common/src/http/core/http-types.ts#L42)

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### url

`string`

##### config?

`Omit`\<[`RequestOptions`](RequestOptions.md), `"url"` \| `"method"`\>

#### Returns

`Promise`\<[`HttpResponse`](HttpResponse.md)\<`T`\>\>

***

### patch()

> **patch**\<`T`\>(`url`, `data`?, `config`?): `Promise`\<[`HttpResponse`](HttpResponse.md)\<`T`\>\>

Defined in: [common/src/http/core/http-types.ts:64](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/common/src/http/core/http-types.ts#L64)

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### url

`string`

##### data?

`unknown`

##### config?

`Omit`\<[`RequestOptions`](RequestOptions.md), `"url"` \| `"method"`\>

#### Returns

`Promise`\<[`HttpResponse`](HttpResponse.md)\<`T`\>\>

***

### post()

> **post**\<`T`\>(`url`, `data`?, `config`?): `Promise`\<[`HttpResponse`](HttpResponse.md)\<`T`\>\>

Defined in: [common/src/http/core/http-types.ts:47](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/common/src/http/core/http-types.ts#L47)

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### url

`string`

##### data?

`unknown`

##### config?

`Omit`\<[`RequestOptions`](RequestOptions.md), `"url"` \| `"method"`\>

#### Returns

`Promise`\<[`HttpResponse`](HttpResponse.md)\<`T`\>\>

***

### put()

> **put**\<`T`\>(`url`, `data`?, `config`?): `Promise`\<[`HttpResponse`](HttpResponse.md)\<`T`\>\>

Defined in: [common/src/http/core/http-types.ts:53](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/common/src/http/core/http-types.ts#L53)

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### url

`string`

##### data?

`unknown`

##### config?

`Omit`\<[`RequestOptions`](RequestOptions.md), `"url"` \| `"method"`\>

#### Returns

`Promise`\<[`HttpResponse`](HttpResponse.md)\<`T`\>\>

***

### removeInterceptor()

> **removeInterceptor**(`id`): `void`

Defined in: [common/src/http/core/http-types.ts:89](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/common/src/http/core/http-types.ts#L89)

Remove interceptor by ID

#### Parameters

##### id

`number`

#### Returns

`void`

***

### request()

> **request**\<`T`\>(`config`): `Promise`\<[`HttpResponse`](HttpResponse.md)\<`T`\>\>

Defined in: [common/src/http/core/http-types.ts:40](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/common/src/http/core/http-types.ts#L40)

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### config

[`RequestOptions`](RequestOptions.md)

#### Returns

`Promise`\<[`HttpResponse`](HttpResponse.md)\<`T`\>\>
