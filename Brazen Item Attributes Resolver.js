// ==UserScript==
// @name         Brazen Item Attributes Resolver
// @namespace    brazenvoid
// @version      2.2.2
// @author       brazenvoid
// @license      GPL-3.0-only
// @description  Item attributes resolution helper class
// ==/UserScript==

class BrazenItemAttributesResolver
{
    /**
     * @typedef {{itemLinkSelector: JQuery.Selector, itemDeepAnalysisSelector: JQuery.Selector, requestDelay: number,
     *            onDeepAttributesResolution: Function}} ItemAttributesResolverConfiguration
     */
    
    /**
     * @callback ItemAttributesResolverCallback
     * @param {JQuery} item
     * @return {*}
     */
    
    /**
     * @param {ItemAttributesResolverConfiguration} configuration
     */
    constructor(configuration)
    {
        /**
         * @type {{}}
         * @private
         */
        this._attributes = {}
        
        /**
         * @type {{}}
         * @private
         */
        this._deepAttributes = {}
        
        /**
         * @type {boolean}
         * @private
         */
        this._hasDeepAttributes = false
        
        /**
         * @type {JQuery.Selector}
         * @protected
         */
        this._itemLinkSelector = configuration.itemLinkSelector
        
        /**
         * @type {JQuery.Selector}
         * @protected
         */
        this._itemDeepAnalysisSelector = configuration.itemDeepAnalysisSelector
        
        /**
         * @type {Function}
         * @private
         */
        this._onDeepAttributesResolution = configuration.onDeepAttributesResolution
        
        /**
         * @type {number}
         * @private
         */
        this._requestDelay = configuration.requestDelay
        
        /**
         * @type {number}
         * @private
         */
        this._requestIteration = 1
        
        /**
         * @type {JQuery<HTMLElement> | jQuery | HTMLElement}
         * @private
         */
        this._sandbox = $('<div id="brazen-item-attributes-resolver-sandbox" hidden/>').appendTo('body')
    }
    
    /**
     * @param {string} attribute
     * @returns {string}
     * @private
     */
    _formatAttributeName(attribute)
    {
        return attribute.toLowerCase().replaceAll(' ', '_')
    }
    
    /**
     * @param {JQuery} item
     * @param {Object} attributesBag
     * @private
     */
    _loadDeepAttributes(item, attributesBag)
    {
        let url = item.find(this._itemLinkSelector).first().attr('href')
        if (url) {
            Utilities.sleep(this._requestIteration * this._requestDelay).then(() => {
                try {
                    this._sandbox.load(url + ' ' + this._itemDeepAnalysisSelector, () => {
                        for (const attributeName in this._deepAttributes) {
                            attributesBag[attributeName] = this._deepAttributes[attributeName](this._sandbox)
                        }
                        this._onDeepAttributesResolution(item)
                        this._sandbox.empty()
                    })
                } catch (error) {
                    console.error('Deep attributes loading failed.')
                }
            })
            this._requestIteration++
        }
    }
    
    /**
     * @param {string} attribute
     * @param {ItemAttributesResolverCallback} resolutionCallback
     * @returns {this}
     */
    addAttribute(attribute, resolutionCallback)
    {
        this._attributes[this._formatAttributeName(attribute)] = resolutionCallback
        return this
    }
    
    /**
     * @param {string} attribute
     * @param {ItemAttributesResolverCallback} resolutionCallback
     * @returns {this}
     */
    addDeepAttribute(attribute, resolutionCallback)
    {
        this._deepAttributes[this._formatAttributeName(attribute)] = resolutionCallback
        this._hasDeepAttributes = true
        return this
    }
    
    /**
     * @returns {BrazenItemAttributesResolver}
     */
    completeResolutionRun()
    {
        this._requestIteration = 1
        return this
    }
    
    /**
     * @param {JQuery} item
     * @param {string} attribute
     * @returns {*}
     */
    get(item, attribute)
    {
        let attributesBag = item[0].scriptAttributes
        if (typeof attributesBag !== 'undefined') {
            let attributeName = this._formatAttributeName(attribute)
            let attributeValue = attributesBag[attributeName]
            if (typeof attributeValue !== 'undefined') {
                return attributeValue
            } else if (this._hasDeepAttributes) {
                this._loadDeepAttributes(item, attributesBag)
            }
        }
        return null
    }
    
    /**
     * @param {JQuery} item
     * @param {Function|null} afterResolutionCallback
     */
    resolveAttributes(item, afterResolutionCallback = null)
    {
        let attributesBag = {}
        item[0].scriptAttributes = attributesBag
        
        for (const attributeName in this._attributes) {
            attributesBag[attributeName] = this._attributes[attributeName](item)
        }
    }
    
    /**
     * @param {JQuery} item
     * @param {string} attribute
     * @param {*} value
     * @returns {BrazenItemAttributesResolver}
     */
    set(item, attribute, value)
    {
        item[0].scriptAttributes[this._formatAttributeName(attribute)] = value
        return this
    }
}