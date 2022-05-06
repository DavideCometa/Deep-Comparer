const ChangeState = {
    Deleted: 'Deleted',
    Updated: 'Updated',
    Added: 'Added'
};

/*
* @author: davic. Github: https://github.com/DavideCometa
* @param {Object} elem1: it must be the original object (or older one)
* @param {Object} elem2: it must be the updated object (or newer one)
* @param {String} keyPath: An optional parameter. It specifies a starting keyPath in order to add it in changelog paths as starting point.
*                          If anything is specified, root will be the starting keyPath.
* @param {String[]} keysToIgnore:   An optional parameter. An array of keys that will not be included in the compare checks.
* @param {Object} formatTemplate:   An optional parameter. Specifies a format for a given object in case you do not want to return an entire 
*                                   nested object as a change but just some meaningfull keys.
*                                   It accepts one or more templates where key is path.targetKey (where path is at least 1 key before the target)
*                                   and value is an array of keys that must be selected. It also accepts nested selections.
*                                   If value is set as hidden the targetKey will be ignored in the output.
* @return {Object} This is the changelog object
*/


export default  function DeepCompare (elem1, elem2, keyPath, keysToIgnore, formatTemplate) {

    let changes = [];

    if(!elem1 || !elem2)
        return null;
    
    if (Array.isArray(elem1) && Array.isArray(elem2)) {
        deepArrayCompare(elem1, elem2, keyPath, keysToIgnore, false, formatTemplate).map(obj => {
            changes.push(obj);
        });
        deepArrayCompare(elem2, elem1, keyPath, keysToIgnore, true, formatTemplate).map(obj => {
            changes.push(obj);
        });
    } else if (typeof elem1 === 'object' && typeof elem2 === 'object') {
        deepObjectCompare(elem1, elem2, keyPath, keysToIgnore, false, formatTemplate).map(obj => {
            changes.push(obj);
        });
        deepObjectCompare(elem2, elem1, keyPath, keysToIgnore, true, formatTemplate).map(obj => {
            changes.push(obj);
        });
    } else if (elem1 != elem2) {
        changes.push(getChangelogPiece(elem1, elem2, keyPath, ChangeState.Updated, formatTemplate));
    }
    
    return changes;
}

function getChangelogPiece(val1, val2, path, changeStatus, formatTemplate) {
    
    switch(changeStatus) {
        case ChangeState.Deleted:
            return {keyPath: path, oldVal: val1, note: "DELETED"};
        case ChangeState.Updated:
            return {keyPath: (path) ? path : 'root', oldVal: setObjectFormat(val1, formatTemplate, path), newVal: setObjectFormat(val2, formatTemplate), note: "UPDATED"};
        case ChangeState.Added:
            return {keyPath: (path) ? path : 'root', newVal: setObjectFormat(val1, formatTemplate, path), note: "ADDED"};
    }
            
}

function setObjectFormat(obj, formatTemplate, path) {
    if(typeof obj === 'object' && formatTemplate) {
        let pathKeys = path.split(' -> ').map(elem => elem.split('.')[0]); //clear array indexes
        let result = {};

        let objKeys = Object.entries(obj).map(elem => elem[0]);

        for(let objKey of objKeys) {
            let formatEntryFound = false;
            for(let formatEntry of Object.entries(formatTemplate)) {
                let formatEntryPath = formatEntry[0];
                let pathFound = true;
                let formatKeys = formatEntryPath.split('.');
                let targetKey = formatKeys.splice(-1)[0];

                for(let formatKey of formatKeys) {
                    if(!pathKeys.includes(formatKey)) {
                        pathFound = false;
                        break;
                    }
                }

                if(pathFound) {
                    if(objKey == targetKey) {
                        //This obj entry needs formatting
                        if(formatEntry[1][0] != "hidden") {
                            result[objKey] = retrieveFormattedObj(obj[objKey], formatEntry[1]); //formatEntry value
                        }
                        formatEntryFound = true;
                    }
                }
            }

            if(!formatEntryFound) {
                result[objKey] = obj[objKey];
            }
        }

        return result;
        
    } else 
        return obj;
}

function retrieveFormattedObj(obj, formatTemplate) {
    let result = {};

    if(Array.isArray(obj)) {
        result = [];
        for(let elem of obj) {
            result.push(retrieveFormattedObj(elem, formatTemplate));
        }
        return result;
    } else {
        for(let formatKey of formatTemplate) {
            if(typeof formatKey === "object") { //format Key is an object of type {"key": [..]}
                result[Object.keys(formatKey)[0]] = retrieveFormattedObj(obj[Object.keys(formatKey)[0]], Object.values(formatKey)[0]);
            } else if(obj[formatKey]){
                result[formatKey] = obj[formatKey];
            }
        }
    }

    return result;
}
        
function deepObjectCompare(obj1, obj2, keyPath, keysToIgnore, reverseOrder, formatTemplate) {

    let changes = [];

    for(let entry of Object.entries(obj1)) {
        let key = entry[0];
        let value = entry[1];

        if(keysToIgnore && keysToIgnore.includes(key))
            continue;

        let currentPath = (keyPath) ? keyPath + " -> " + key : key;
        
        if(obj2[key] == undefined && value != "") {
            if(reverseOrder) {
                changes.push(getChangelogPiece(value, undefined, currentPath, ChangeState.Added, formatTemplate));
            } else {
                changes.push(getChangelogPiece(value, undefined, currentPath, ChangeState.Deleted));
            }
        }
        else if(Array.isArray(value)) {
            
            if(Array.isArray(obj2[key])) {
                deepArrayCompare(value, obj2[key], currentPath, keysToIgnore, reverseOrder, formatTemplate).map(obj => {
                    changes.push(obj)
                });
            } else if(!reverseOrder){
                changes.push(getChangelogPiece(value, obj2[key], currentPath, ChangeState.Updated, formatTemplate));
            }
            
        }
        else if(typeof value === 'object') {

            if(typeof obj2[key] === 'object' ) {
                deepObjectCompare(value, obj2[key], currentPath, keysToIgnore, reverseOrder, formatTemplate).map(obj => {
                    changes.push(obj);
                });
            } else if(!reverseOrder){
                changes.push(getChangelogPiece(value, obj2[key], currentPath, ChangeState.Updated, formatTemplate));
            }
            
        }
        else if(value != obj2[key] && !reverseOrder) {
            changes.push(getChangelogPiece(value, obj2[key], currentPath, ChangeState.Updated, formatTemplate));
        }

    }

    return changes;
    
}

function deepArrayCompare(arr1, arr2, keyPath, keysToIgnore, reverseOrder, formatTemplate) {

    let diffs = [];
    
    //Check for each element of arr1
    for(let i = 0; i<arr1.length; i++) {
        
        if(!arr2[i] && arr1[i] != "") {
            if(reverseOrder) {
                diffs.push(getChangelogPiece(arr1[i], undefined, keyPath + "." + i, ChangeState.Added, formatTemplate));
            } else {
                diffs.push(getChangelogPiece(arr1[i], undefined, keyPath + "." + i, ChangeState.Deleted));
            }
        }
        else if(Array.isArray(arr1[i])) {

            if(Array.isArray(arr2[i])) {
                deepArrayCompare(arr1[i], arr2[i], keyPath + "." + i, keysToIgnore, reverseOrder, formatTemplate).map(obj => {
                    diffs.push(obj);
                });
            } else if(!reverseOrder){
                diffs.push(getChangelogPiece(arr1[i], arr2[i], keyPath + "." + i, ChangeState.Updated, formatTemplate));
            }

        }
        else if(typeof arr1[i] === 'object') {

            if(typeof arr2[i] === 'object') {
                deepObjectCompare(arr1[i], arr2[i], keyPath + "." + i, keysToIgnore, reverseOrder, formatTemplate).map(obj => {
                    diffs.push(obj);
                });
            } else if(!reverseOrder) {
                diffs.push(getChangelogPiece(arr1[i], arr2[i], keyPath + "." + i, ChangeState.Updated, formatTemplate));
            }

        } else if(arr1[i] != arr2[i] && !reverseOrder) {
            diffs.push(getChangelogPiece(arr1[i], arr2[i], keyPath + "." + i, ChangeState.Updated, formatTemplate));
        }

    }

    return diffs;
}