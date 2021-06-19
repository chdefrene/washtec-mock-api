# WashTec Mock API

This API provides mock responses for a subset of endpoints from the WashTec API.

Both request and response formats have been kept as close as possible to the real API, to facilitate switching to the
real API in the future.

## API Information

**BASE URL:** https://washtec-mock-api.vercel.app/api

#### Authentication

WashTec expects authentication credentials from the following keys in the HTTP headers. The mock API expects the same
keys, but doesn't check the values.

* `Username`
* `Password-Utf8-Base64`
* `Interaction-Uuid`
* `MachineDirectAccessRole`

#### Content-Type

The Content-Type HTTP header should be set to `application/json`

#### Simulated washing state

The API simulates the machines being in use between minute 0 through 10, 20 through 30, and 40 through 50. E.g. if you
make the request at 12:39 the machine will be free, but if you make it at 12:40 it will be occupied.

## Endpoints

The mock API provides the following endpoints.

### List All Machines

URL: `GET` https://washtec-mock-api.vercel.app/api/v1/virtual-service-owners/a-random-id/machines

*Note that `a-random-id` can be set to anything you want.*

Response example:

```
{
    "10230516": {
        "siteId": 1072839001,
        "name": "Vaskehall Lørenskog",
        "postcode": "1461",
        "place": "Lørenskog",
        "street": "Solheimveien",
        "streetNumber": "11",
        "nativeServiceOwnerDisplayName": "Bertel O. Steen AS",
        "isBusy": false,
        ...
    },
    "10230515": {
        ...
    },
    ...
}
```

### Machine Status

URL: `POST` https://washtec-mock-api.vercel.app/api/v1/machine-direct-access

Expects the following request body:

```
{
    "deviceUUID": "a-random-id",
    "method": "GET",
    "path": "state/v1",
    "payload": "a-random-string"
}
```

Response example:

```
{
    "responseCode": 200,
    "payload": "{\n    \"transaction-id\": 478503763,\n    \"success\": true,\n    \"msg\": \"\",\n    \"result\": {\n        \"ts-current\": 1624126535,\n        \"ts-last-update\": 1624126235,\n        \"operation-mode\": 1,\n        \"carwash-state\": 10,\n        \"remaining-washtime\": 0,\n        \"current-ticket-id\": 0\n    }\n}"
}
```

### Start Wash

URL: `POST` https://washtec-mock-api.vercel.app/api/v1/machine-direct-access

Expects the following request body:

```
{
    "deviceUUID": "a-random-id",
    "method": "POST",
    "path": "select-ticket/v1",
    "payload": "a-random-string"
}
```

Response example:

```
{
    "responseCode": 200,
    "payload": "{\n    \"transaction-id\": 380591454,\n    \"success\": true,\n    \"msg\": \"\",\n    \"result\": {}\n}"
}
```
