# Deep Comparer

Deep Comparer is a specialized utility crafted for performing meticulous comparisons between two complex elements (objects or arrays). These elements may contain nested structures including other objects and arrays. The output of the comparison is a detailed changelog that pinpoints all the modifications, enumerating the keys that have been added, updated, or deleted, alongside their respective values.

## Installation 
```bash
npm install deep-comparer
```

## Usage example:

Utilizing Deep Comparer is straightforward. The core function requires two arguments representing the elements to be compared. It is imperative to pass the older version as the first argument followed by the newer version to ensure the changelog reflects accurate changes.

```js
const { createDeepComparer } = require('deep-comparer');

const olderVersion = {...};  // Your older JSON object
const newerVersion = {...};  // Your newer JSON object

const deepCompare = createDeepComparer();
const changelog = await deepCompare(olderVersion, newerVersion); // it can take an optional parameter root

console.log(changelog);
```

Let's suppose we have two complex JSON objects:

```js
let userData1 = {
  id: 213827,
  data: {
    username: 'testUser1',
    email: 'testEmail@gmail.com',
    subscriptionDate: '01-02-2022',
    address: {
      country: 'Italy',
    },
  },
  someArrayProperties: [2, 412, 12, 3, 2],
};

let userData2 = {
  id: 213827,
  data: {
    username: 'testUser1',
    email: 'newEmail@gmail.com',
    address: {
      country: 'Italy',
      street: 'Example street',
    },
  },
  someArrayProperties: [2, 412, 12, 3, 2, 657],
};
```

Calling the deep compare for these two objects:

```js
const deepCompare = createDeepComparer(['keyToIgnore'], ['keyToHide']);
var changelog = await deepCompare(userData1, userData2);
console.log(changelog);
```

deepCompare will produce a result like the following:

```js
[
  {
    path: 'root.data.email',
    oldVal: 'testEmail@gmail.com',
    newVal: 'newEmail@gmail.com',
    note: 'UPDATED',
  },
  {
    path: 'root.data.subscriptionDate',
    oldVal: '01-02-2022',
    note: 'DELETED',
  },
  {
    path: 'root.data.address.street',
    newVal: 'Example street',
    note: 'ADDED',
  },
  { 
    path: 'root.someArrayProperties[5]', 
    newVal: 657, 
    note: 'ADDED' 
  },
];
```

It is also possible to ignore keys during the comparisons or to filter out keys (like sensible data) from the output changelog.

```js
const deepCompare = createDeepComparer({
  keysToIgnore: ['street'],  // Keys named "street" will be ignored during comparison
  keysToMask: ['email']  // Keys named "email" will be filtered out in the changelog
});
```

## Testing
This package is rigorously tested to ensure it functions correctly with various data structures. Run the test suite using the following command:
```bash
npm test
```

## Contributing
Contributions to improve Deep Comparer are welcomed. Feel free to submit a pull request or open an issue to discuss potential enhancements.
