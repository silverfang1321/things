// ==UserScript==
// @name         Base Brazen Resource
// @namespace    brazenvoid
// @version      3.9.0
// @author       brazenvoid
// @license      GPL-3.0-only
// @description  Base library for my scripts
// @run-at  	 document-end
// ==/UserScript==

const REGEX_LINE_BREAK = /\r?\n/g
const REGEX_PRESERVE_NUMBERS = /\D/g

class ChildObserver
{
    /**
     * @callback observerOnMutation
     * @param {NodeList} nodes
     * @param {Element} previousSibling
     * @param {Element} nextSibling
     * @param {Element} target
     */

    /**
     * @return {ChildObserver}
     */
    static create ()
    {
        return new ChildObserver
    }

    /**
     * ChildObserver constructor
     */
    constructor ()
    {
        this._node = null
        this._observer = null
        this._onNodesAdded = null
        this._onNodesRemoved = null
    }

    /**
     * @return {ChildObserver}
     * @private
     */
    _observeNodes ()
    {
        this._observer.observe(this._node, {childList: true})
        return this
    }

    /**
     * Attach an observer to the specified node(s)
     * @param {Node} node
     * @returns {ChildObserver}
     */
    observe (node)
    {
        this._node = node
        this._observer = new MutationObserver((mutations) => {
            for (let mutation of mutations) {
                if (mutation.addedNodes.length && this._onNodesAdded !== null) {
                    this._onNodesAdded(
                        mutation.addedNodes,
                        mutation.previousSibling,
                        mutation.nextSibling,
                        mutation.target,
                    )
                }
                if (mutation.removedNodes.length && this._onNodesRemoved !== null) {
                    this._onNodesRemoved(
                        mutation.removedNodes,
                        mutation.previousSibling,
                        mutation.nextSibling,
                        mutation.target,
                    )
                }
            }
        })
        return this._observeNodes()
    }

    /**
     * @param {observerOnMutation} eventHandler
     * @returns {ChildObserver}
     */
    onNodesAdded (eventHandler)
    {
        this._onNodesAdded = eventHandler
        return this
    }

    /**
     * @param {observerOnMutation} eventHandler
     * @returns {ChildObserver}
     */
    onNodesRemoved (eventHandler)
    {
        this._onNodesRemoved = eventHandler
        return this
    }

    pauseObservation ()
    {
        this._observer.disconnect()
    }

    resumeObservation ()
    {
        this._observeNodes()
    }
}

class LocalStore
{
    /**
     * @callback storeEventHandler
     * @param {Object} store
     */

    /**
     * @param {string} key
     * @param {Object} defaults
     */
    constructor (key, defaults)
    {
        /**
         * @type {Object}
         * @private
         */
        this._defaults = defaults

        /**
         * @type {boolean}
         * @private
         */
        this._defaultsSet = false

        /**
         * @type {string}
         * @private
         */
        this._key = key

        // Events

        /**
         * @type {storeEventHandler}
         */
        this._onChange = null
    }

    _handleOnChange ()
    {
        if (this._onChange !== null) {
            this._onChange(this.get())
        }
    }

    /**
     * @return {LocalStore}
     */
    delete ()
    {
        window.localStorage.removeItem(this._key)
        return this
    }

    /**
     * @return {*}
     */
    get ()
    {
        this._defaultsSet = false
        let storedStore = window.localStorage.getItem(this._key)
        return storedStore === null ? this.restoreDefaults() : Utilities.objectFromJSON(storedStore)
    }

    /**
     * @param {storeEventHandler} handler
     * @return {LocalStore}
     */
    onChange (handler)
    {
        this._onChange = handler
        return this
    }

    /**
     * @return {Object}
     */
    restoreDefaults ()
    {
        this._defaultsSet = true
        this.save(this._defaults)
        return this._defaults
    }

    /**
     * @param {Object} data
     * @return {LocalStore}
     */
    save (data)
    {
        window.localStorage.setItem(this._key, Utilities.objectToJSON(data))
        this._handleOnChange()
        return this
    }

    /**
     * @return {boolean}
     */
    wereDefaultsSet ()
    {
        return this._defaultsSet
    }
}

class SelectorGenerator
{
    /**
     * @param {string} selectorPrefix
     */
    constructor (selectorPrefix)
    {
        /**
         * @type {string}
         * @private
         */
        this._prefix = selectorPrefix
    }

    /**
     * @param {string} selector
     * @return {string}
     */
    getSelector (selector)
    {
        return this._prefix + selector
    }

    /**
     * @param {string} settingName
     * @return {string}
     */
    getSettingsInputSelector (settingName)
    {
        return this.getSelector(Utilities.toKebabCase(settingName) + '-setting')
    }

    /**
     * @param {string} settingName
     * @param {boolean} getMinInputSelector
     * @return {string}
     */
    getSettingsRangeInputSelector (settingName, getMinInputSelector)
    {
        return this.getSelector(Utilities.toKebabCase(settingName) + (getMinInputSelector ? '-min' : '-max') + '-setting')
    }

    /**
     * @param {string} statisticType
     * @return {string}
     */
    getStatLabelSelector (statisticType)
    {
        return this.getSelector(Utilities.toKebabCase(statisticType) + '-stat')
    }
}

class StatisticsRecorder
{
    /**
     * @param {string} selectorPrefix
     */
    constructor (selectorPrefix)
    {
        /**
         * @type {SelectorGenerator}
         * @private
         */
        this._selectorGenerator = new SelectorGenerator(selectorPrefix)

        /**
         * @type {{Total: number}}
         * @private
         */
        this._statistics = {Total: 0}
    }
    
    getTotal()
    {
        return this._statistics.Total
    }

    /**
     * @param {string} statisticType
     * @param {boolean} validationResult
     * @param {number} value
     */
    record (statisticType, validationResult, value = 1)
    {
        if (!validationResult) {
            if (typeof this._statistics[statisticType] !== 'undefined') {
                this._statistics[statisticType] += value
            } else {
                this._statistics[statisticType] = value
            }
            this._statistics.Total += value
        }
    }

    reset ()
    {
        for (const statisticType in this._statistics) {
            this._statistics[statisticType] = 0
        }
    }

    updateUI ()
    {
        let label, labelSelector

        for (const statisticType in this._statistics) {
            labelSelector = this._selectorGenerator.getStatLabelSelector(statisticType)
            label = document.getElementById(labelSelector)
            if (label !== null) {
                label.textContent = this._statistics[statisticType]
            }
        }
    }
}

class Utilities
{
    /**
     * @param {string[]} words
     * @return {RegExp|null}
     */
    static buildWholeWordMatchingRegex (words)
    {
        if (words.length) {
            let patternedWords = []
            for (const element of words) {
                patternedWords.push('\\b' + element + '\\b')
            }
            return new RegExp('(' + patternedWords.join('|') + ')', 'gi')
        }
        return null
    }

    static callEventHandler (handler, parameters = [], defaultValue = null)
    {
        return handler ? handler(...parameters) : defaultValue
    }

    static callEventHandlerOrFail (name, handler, parameters = [])
    {
        if (handler) {
            return handler(...parameters)
        }
        throw new Error('Callback "' + name + '" must be defined.')
    }

    /**
     * @return {number|string}
     */
    static generateId (prefix = null)
    {
        let id = Math.trunc(Math.random() * 1000000000)
        return prefix ? prefix + id.toString() : id
    }

    /**
     * @param {string} json
     * @return {Object}
     */
    static objectFromJSON (json)
    {
        /** @type {{arrays: Object, objects: Object, properties: Object}} */
        let parsedJSON = JSON.parse(json)
        let arrayObject = {}
        let result = {}

        for (let property in parsedJSON.arrays) {
            arrayObject = JSON.parse(parsedJSON.arrays[property])
            result[property] = []

            for (let key in arrayObject) {
                result[property].push(arrayObject[key])
            }
        }
        for (let property in parsedJSON.objects) {
            result[property] = Utilities.objectFromJSON(parsedJSON.objects[property])
        }
        for (let property in parsedJSON.properties) {
            result[property] = parsedJSON.properties[property]
        }
        return result
    }

    /**
     * @param {Object} object
     * @return {string}
     */
    static objectToJSON (object)
    {
        let arrayToObject
        let json = {arrays: {}, objects: {}, properties: {}}
        for (let property in object) {
            if (typeof object[property] === 'object') {
                if (Array.isArray(object[property])) {
                    arrayToObject = {}
                    for (let key in object[property]) {
                        arrayToObject[key] = object[property][key]
                    }
                    json.arrays[property] = JSON.stringify(arrayToObject)
                } else {
                    json.objects[property] = Utilities.objectToJSON(object[property])
                }
            } else {
                json.properties[property] = object[property]
            }
        }
        return JSON.stringify(json)
    }
    
    static processEventHandlerQueue (handlers, parameters = [], defaultValue = null)
    {
        if (handlers.length) {
            for (let handler of handlers) {
                handler(...parameters)
            }
        }
        return defaultValue
    }

    /**
     * @param milliseconds
     * @return {Promise<*>}
     */
    static sleep (milliseconds)
    {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
    }

    /**
     * @param {string} text
     * @return {string}
     */
    static toKebabCase (text)
    {
        return text.toLowerCase().replaceAll(' ', '-')
    }

    /**
     * @param {string[]} strings
     */
    static trimAndKeepNonEmptyStrings (strings)
    {
        let nonEmptyStrings = [], trimmedString
        for (let string of strings) {
            trimmedString = string.trim()
            if (trimmedString !== '') {
                nonEmptyStrings.push(trimmedString)
            }
        }
        return nonEmptyStrings
    }
}

class Validator
{
    /**
     * @param {JQuery} item
     * @param {string} selector
     * @return {boolean}
     */
    static doesChildExist (item, selector)
    {
        return item.find(selector).length > 0
    }

    static iFramesRemover ()
    {
        GM_addStyle('iframe { display: none !important; }')
    }

    /**
     * @param {JQuery} item
     * @param {JQuery.Selector} selector
     * @return {boolean}
     */
    static isChildMissing (item, selector)
    {
        return item.find(selector).length === 0
    }

    /**
     * @param {number} value
     * @param {number} lowerBound
     * @param {number} upperBound
     * @return {boolean}
     */
    static isInRange (value, lowerBound, upperBound)
    {
        let validationCheck = true

        if (lowerBound > 0 && upperBound > 0) {
            validationCheck = value >= lowerBound && value <= upperBound
        } else {
            if (lowerBound > 0) {
                validationCheck = value >= lowerBound
            }
            if (upperBound > 0) {
                validationCheck = value <= upperBound
            }
        }
        return validationCheck
    }

    /**
     * @param {string} text
     * @param {Object} rules
     * @return {string}
     */
    static sanitize (text, rules)
    {
        if (rules) {
            for (const substitute in rules) {
                text = text.replace(rules[substitute], substitute)
            }
        }
        return text.trim()
    }

    /**
     * @param {JQuery} textNode
     * @param {Object} rules
     * @return {Validator}
     */
    static sanitizeTextNode (textNode, rules)
    {
        textNode.text(Validator.sanitize(textNode.text(), rules))
        return this
    }

    /**
     * @param {string} selector
     * @param {Object} rules
     * @return {Validator}
     */
    static sanitizeNodeOfSelector (selector, rules)
    {
        let node = $(selector)
        if (node.length) {
            let sanitizedText = Validator.sanitize(node.text(), rules)
            node.text(sanitizedText)
            document.title = sanitizedText
        }
        return this
    }

    /**
     * @param {string} text
     * @param {Object} rules
     * @return {boolean}
     */
    static regexMatches (text, rules)
    {
        return rules ? text.match(rules) !== null : true
    }

    /**
     * @param {string} text
     * @param {Object} rules
     * @return {boolean}
     */
    static validateTextDoesNotContain (text, rules)
    {
        return rules ? text.match(rules) === null : true
    }
}