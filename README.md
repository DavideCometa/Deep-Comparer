# Deep Object Comparator 

The purpose of this package is to deeply compare two complex JSON objects (with nested objects or arrays) 
and return a detailed changelog with deleted, added or updated keys (and their value).
It supports also format templates in order to produce cleaner changelogs.

The only two mandatory parameters are the 2 objects (pass the older one before the newer in order to get
the a correct changelog).

# Usage example:

Let's suppose we have two complex JSON objects:
```js
let userData1 = {
	"id": 213827,
	"data" : {
		"username": "testUser1",
		"email": "testEmail@gmail.com",
		"subscriptionDate": "01-02-2022"
		"address" : {
			"country": "Italy"
		}
	},
	"someArrayProperties": [2,412,12,3,2]
}

let userData2 = {
	"id": 213827,
	"data" : {
		"username": testUser1,
		"email": newEmail@gmail.com
		"address" : {
			"country": Italy,
			"street": "Example street",
		}
	},
	"someArrayProperties": [2,412,12,3,2,657]
}



//calling

	DeepCompare(userData1, userData2);
	
//will produce a result like this:

[
  {
    keyPath: 'data -> email',
    oldVal: 'testEmail@gmail.com',
    newVal: 'newEmail@gmail.com',
    note: 'UPDATED'
  },
  {
    keyPath: 'data -> subscriptionDate',
    oldVal: '01-02-2022',
    note: 'DELETED'
  },
  {
    keyPath: 'data -> address -> street',
    newVal: 'Example street',
    note: 'ADDED'
  },
  { keyPath: 'someArrayProperties.5', newVal: 657, note: 'ADDED' }
]

```


Parameters description:
```js
 {Object} elem1: it must be the original object (or older one)
 
 {Object} elem2: it must be the updated object (or newer one)
 
 {String} keyPath: An optional parameter. It specifies a starting keyPath in order to add it in changelog paths as starting point.
                   If anything is specified, root will be the starting keyPath.
						 
 {String[]} keysToIgnore:   An optional parameter. An array of keys that will not be included in the compare checks.
 
 {Object} formatTemplate:   An optional parameter. Specifies a format for a given object in case you do not want to return an entire 
                            nested object as a change but just some meaningfull keys.
                            It accepts one or more templates where key is path.targetKey (where path is at least 1 key before the target)
                            and value is an array of keys that must be selected. It also accepts nested selections.
                            If value is set as hidden the targetKey will be ignored in the output. 
								  
return {Object} This is the changelog object

```
