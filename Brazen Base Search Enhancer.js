// ==UserScript==
// @name         Brazen Base Search Enhancer
// @namespace    brazenvoid
// @version      6.3.1
// @author       brazenvoid
// @license      GPL-3.0-only
// @description  Base class for search enhancement scripts
// ==/UserScript==

const ICON_RECYCLE = '&#x267B'

// Preset filter configuration keys

const CONFIG_PAGINATOR_LIMIT = 'Pagination Limit'
const CONFIG_PAGINATOR_THRESHOLD = 'Pagination Threshold'

const FILTER_DURATION_RANGE = 'Duration'
const FILTER_PERCENTAGE_RATING_RANGE = 'Rating'
const FILTER_SUBSCRIBED_VIDEOS = 'Hide Subscribed Videos'
const FILTER_TAG_BLACKLIST = 'Tag Blacklist'
const FILTER_TEXT_BLACKLIST = 'Blacklist'
const FILTER_TEXT_SEARCH = 'Search'
const FILTER_TEXT_SANITIZATION = 'Text Sanitization Rules'
const FILTER_TEXT_WHITELIST = 'Whitelist'
const FILTER_UNRATED = 'Unrated'

const STORE_SUBSCRIPTIONS = 'Account Subscriptions'

// Item preset attributes

const ITEM_NAME = 'name'
const ITEM_PROCESSED_ONCE = 'processedOnce'

// Configuration

const OPTION_ENABLE_TEXT_BLACKLIST = 'Enable Text Blacklist'
const OPTION_ENABLE_TAG_BLACKLIST = 'Enable Tag Blacklist'
const OPTION_ALWAYS_SHOW_SETTINGS_PANE = 'Always Show Settings Pane'
const OPTION_DISABLE_COMPLIANCE_VALIDATION = 'Disable All Filters'

class BrazenBaseSearchEnhancer
{
    /**
     * @typedef {{configKey: string, validate: SearchEnhancerFilterValidationCallback, comply: SearchEnhancerFilterComplianceCallback}} ComplianceFilter
     */

    /**
     * @typedef {{isUserLoggedIn: boolean, itemDeepAnalysisSelector: JQuery.Selector, itemListSelectors: JQuery.Selector, itemLinkSelector: JQuery.Selector,
     *            itemNameSelector: JQuery.Selector, itemSelectors: JQuery.Selector, requestDelay: number, scriptPrefix: string,
     *            tagSelectorGenerator?: ConfigurationManagerTagRulesetSelectorGeneratorCallback|null}} Configuration
     */

    /**
     * @callback SearchEnhancerFilterValidationCallback
     * @param {*} configValues
     * @return boolean
     */

    /**
     * @callback SearchEnhancerFilterComplianceCallback
     * @param {JQuery} item
     * @param {*} configValues
     * @return {*}
     */

    /**
     * @callback SubscriptionsFilterExclusionsCallback
     * @return {boolean}
     */

    /**
     * @callback SubscriptionsFilterUsernameCallback
     * @param {JQuery} item
     * @return {boolean|string}
     */

    /**
     * @param {Configuration} configuration
     */
    constructor(configuration)
    {
        /**
         * Array of item compliance filters ordered in intended sequence of execution
         * @type {ComplianceFilter[]}
         * @private
         */
        this._complianceFilters = []

        /**
         * Pagination manager
         * @type BrazenPaginator|null
         * @protected
         */
        this._paginator = null

        /**
         * @type {Configuration}
         * @protected
         */
        this._config = configuration

        /**
         * @type {BrazenItemAttributesResolver}
         * @protected
         */
        this._itemAttributesResolver = new BrazenItemAttributesResolver({
            itemDeepAnalysisSelector: this._config.itemDeepAnalysisSelector,
            itemLinkSelector: this._config.itemLinkSelector,
            requestDelay: this._config.requestDelay,
            onDeepAttributesResolution: (item) => {
                this._complyItem(item)
                Utilities.processEventHandlerQueue(this._onAfterComplianceRun)
            },
        })

        /**
         * @type {boolean}
         * @private
         */
        this._sanitizationEnabled = false

        /**
         * @type {StatisticsRecorder}
         * @protected
         */
        this._statistics = new StatisticsRecorder(this._config.scriptPrefix)

        /**
         * @type {BrazenSubscriptionsLoader|null}
         * @protected
         */
        this._subscriptionsLoader = null

        /**
         * @type {JQuery<HTMLElement> | jQuery | HTMLElement}
         * @protected
         */
        this._syncConfigButton = $('<button id="brazen-sync-config-btn" style="position: fixed"></button>')
            .text(ICON_RECYCLE)
            .hide()
            .appendTo($('body'))
            .on('click', () => {
                this._onResetSettings()
                this._syncConfigButton.hide()
            })

        /**
         * @type {BrazenUIGenerator}
         * @protected
         */
        this._uiGen = new BrazenUIGenerator(this._config.scriptPrefix)

        /**
         * Local storage store with defaults
         * @type {BrazenConfigurationManager}
         * @protected
         */
        this._configurationManager = BrazenConfigurationManager.create(this._uiGen, this._config.tagSelectorGenerator)
            .onExternalConfigurationChange(() => this._validateCompliance())
            .addFlagField(OPTION_DISABLE_COMPLIANCE_VALIDATION, 'Disables all search filters.')
            .addFlagField(OPTION_ALWAYS_SHOW_SETTINGS_PANE, 'Always show configuration interface.')

        // Events

        /**
         * Operations to perform after script initialization
         * @type {function[]}
         * @protected
         */
        this._onAfterInitialization = []

        /**
         * Operations to perform after a complete compliance run
         * @type {function[]}
         * @protected
         */
        this._onAfterComplianceRun = []

        /**
         * Operations to perform after UI generation
         * @type {function[]}
         * @private
         */
        this._onAfterUIBuild = []

        /**
         * Operations to perform before compliance validation. This callback can also be used to skip compliance validation by returning false.
         * @type {function[]}
         * @protected
         */
        this._onBeforeCompliance = []

        /**
         * Operations to perform before UI generation
         * @type {function[]}
         * @private
         */
        this._onBeforeUIBuild = []

        /**
         * Operations to perform after compliance checks, the first time item is retrieved
         * @type {function(JQuery)[]}
         * @protected
         */
        this._onFirstHitAfterCompliance = []

        /**
         * Operations to perform before compliance checks, the first time item is retrieved
         * @type {function(JQuery)[]}
         * @protected
         */
        this._onFirstHitBeforeCompliance = []

        /**
         * Logic to hide a non-compliant item
         * @type {Function}
         * @param {JQuery} item
         * @protected
         */
        this._onItemHide = (item) => {
            item.addClass('noncompliant-item')
            item.hide()
        }

        /**
         * Logic to show compliant item
         * @type {Function}
         * @param {JQuery} item
         * @protected
         */
        this._onItemShow = (item) => {
            item.removeClass('noncompliant-item')
            item.show()
        }

        /**
         * Validate initiating initialization.
         * Can be used to stop script init on specific pages or vice versa
         * @type {Function}
         * @protected
         */
        this._onValidateInit = () => true

        /**
         * Must return the generated settings section node
         * @type {JQuery[]}
         * @protected
         */
        this._userInterface = []
    }

    /**
     * @param {string} helpText
     * @protected
     */
    _addItemBlacklistFilter(helpText)
    {
        this._configurationManager
            .addFlagField(OPTION_ENABLE_TEXT_BLACKLIST, 'Applies the blacklist.')
            .addRulesetField(
                FILTER_TEXT_BLACKLIST,
                5,
                helpText,
                null,
                null,
                (rules) => Utilities.buildWholeWordMatchingRegex(rules) ?? '',
            )
        this._addItemComplexComplianceFilter(
            FILTER_TEXT_BLACKLIST,
            (rules) => this._getConfig(OPTION_ENABLE_TEXT_BLACKLIST) && rules.length,
            (item, value) => this._get(item, ITEM_NAME)?.match(value) === null,
        )
    }

    /**
     * @param {string} configKey
     * @param {SearchEnhancerFilterValidationCallback|null} validationCallback
     * @param {SearchEnhancerFilterComplianceCallback|null|string} complianceCallback
     * @protected
     */
    _addItemComplexComplianceFilter(configKey, validationCallback, complianceCallback)
    {
        this._addItemComplianceFilter(configKey, complianceCallback, validationCallback)
    }

    /**
     * @param {string} configKey
     * @param {SearchEnhancerFilterComplianceCallback|null|string} action
     * @param {SearchEnhancerFilterValidationCallback|null} validationCallback
     * @protected
     */
    _addItemComplianceFilter(configKey, action = null, validationCallback = null)
    {
        let configType = this._configurationManager.getField(configKey).type
        if (action === null) {
            action = configKey
        }
        if (typeof action === 'string') {
            let attributeName = action
            switch (configType) {
                case CONFIG_TYPE_CHECKBOXES_GROUP:
                    action = (item, values) => {
                        let attribute = this._get(item, attributeName)
                        return attribute && values.length ? values.includes(attribute) : true
                    }
                    break
                case CONFIG_TYPE_FLAG:
                    action = (item) => {
                        let attribute = this._get(item, attributeName)
                        return attribute !== null ? attribute : true
                    }
                    break
                case CONFIG_TYPE_RADIOS_GROUP:
                    action = (item, value) => {
                        let attribute = this._get(item, attributeName)
                        return attribute ? value === attribute : true
                    }
                    break
                case CONFIG_TYPE_RANGE:
                    action = (item, range) => {
                        let attribute = this._get(item, attributeName)
                        return attribute ? Validator.isInRange(this._get(item, attributeName), range.minimum, range.maximum) : true
                    }
                    break
                default:
                    throw new Error('Associated config type requires explicit action callback definition.')
            }
        }
        if (validationCallback === null) {
            validationCallback = this._configurationManager.generateValidationCallback(configKey)
        }
        this._complianceFilters.push({
            configKey: configKey,
            validate: validationCallback,
            comply: action,
        })
    }

    /**
     * @param {JQuery.Selector|Function} durationNodeSelector
     * @param {string|null} helpText
     * @protected
     */
    _addItemDurationRangeFilter(durationNodeSelector, helpText = null)
    {
        this._configurationManager.addRangeField(FILTER_DURATION_RANGE, 0, 100000, helpText ?? 'Filter items by duration.')

        this._itemAttributesResolver.addAttribute(FILTER_DURATION_RANGE, (item) => {
            let duration
            if (typeof durationNodeSelector !== 'function') {
                let durationNode = item.find(durationNodeSelector)
                if (durationNode.length) {
                    duration = durationNode.text().trim()
                } else {
                    return null
                }
            } else {
                duration = durationNodeSelector(item)
            }
            duration = duration.split(':')
            duration = (parseInt(duration[0]) * 60) + parseInt(duration[1])
            return duration === 0 ? null : duration
        })

        this._addItemComplianceFilter(FILTER_DURATION_RANGE)
    }

    /**
     * @param {JQuery.Selector} ratingNodeSelector
     * @param {string|null} helpText
     * @param {string|null} unratedHelpText
     * @protected
     */
    _addItemPercentageRatingRangeFilter(ratingNodeSelector, helpText = null, unratedHelpText = null)
    {
        this._configurationManager.addRangeField(FILTER_PERCENTAGE_RATING_RANGE, 0, 100000, helpText ?? 'Filter items by percentage rating.').addFlagField(
            FILTER_UNRATED, unratedHelpText ?? 'Hide items with zero or no rating.')

        this._itemAttributesResolver.addAttribute(FILTER_PERCENTAGE_RATING_RANGE, (item) => {
            let rating = item.find(ratingNodeSelector)
            return rating.length === 0 ? null : parseInt(rating.text().replace('%', ''))
        })

        this._addItemComplianceFilter(FILTER_PERCENTAGE_RATING_RANGE, (item, range) => {
            let rating = this._get(item, FILTER_PERCENTAGE_RATING_RANGE)
            return rating ? Validator.isInRange(rating, range.minimum, range.maximum) : !this._getConfig(FILTER_UNRATED)
        })
    }

    /**
     * @param {int} rows
     * @param {string|null} helpText
     * @protected
     */
    _addItemTagBlacklistFilter(rows = 5, helpText = null)
    {
        if (helpText === null) {
            helpText = 'Specify the tags blacklist with one rule on each line. "&" "|" can be used.'
        }

        this._configurationManager
            .addFlagField(OPTION_ENABLE_TAG_BLACKLIST, 'Applies the blacklist.')
            .addTagRulesetField(FILTER_TAG_BLACKLIST, rows, helpText)

        this._addItemComplexComplianceFilter(
            FILTER_TAG_BLACKLIST,
            (rules) => this._getConfig(OPTION_ENABLE_TAG_BLACKLIST) && rules.length,
            (item, blacklistRuleset) => {
                let isBlacklisted
                for (let rule of blacklistRuleset) {

                    isBlacklisted = true
                    for (let tagSelector of rule) {

                        if (item.find(tagSelector).length === 0) {
                            isBlacklisted = false
                            break
                        }
                    }
                    if (isBlacklisted) {
                        return false
                    }
                }
                return true
            },
        )
    }

    /**
     * @param {string} configKey
     * @param {JQuery|null} otherTagSectionsSelector
     * @param {string} styleClass
     * @param {int} rows
     * @param {string} helpText
     * @protected
     */
    _addItemTagHighlights(configKey, otherTagSectionsSelector, styleClass, helpText, rows = 5)
    {
        this._configurationManager.addTagRulesetField(configKey, rows, helpText)

        let highlightsHandler = (section) => {

            let ruleApplies
            for (let rule of this._configurationManager.getField(configKey).optimized) {

                ruleApplies = true
                for (let tagSelector of rule) {

                    if (section.find(tagSelector).length === 0) {
                        ruleApplies = false
                        break
                    }
                }
                if (ruleApplies) {
                    section.find(rule.join(', ')).addClass(styleClass)
                }
            }
        }
        if (otherTagSectionsSelector !== null && otherTagSectionsSelector.length > 0) {
            this._onBeforeUIBuild.push(() => highlightsHandler(otherTagSectionsSelector))
        }
        this._onFirstHitAfterCompliance.push((item) => highlightsHandler(item))
    }

    /**
     * @param {string} helpText
     * @protected
     */
    _addItemTextSanitizationFilter(helpText)
    {
        this._sanitizationEnabled = true

        this._configurationManager.addRulesetField(FILTER_TEXT_SANITIZATION, 2, helpText, (rules) => {
            let sanitizationRules = {}, fragments, validatedTargetWords
            for (let sanitizationRule of rules) {

                if (sanitizationRule.includes('=')) {
                    fragments = sanitizationRule.split('=')
                    if (fragments[0] === '') {
                        fragments[0] = ' '
                    }

                    validatedTargetWords = Utilities.trimAndKeepNonEmptyStrings(fragments[1].split(','))
                    if (validatedTargetWords.length) {
                        sanitizationRules[fragments[0]] = validatedTargetWords
                    }
                }
            }
            return sanitizationRules
        }, (rules) => {
            let sanitizationRulesText = []
            for (let substitute in rules) {
                sanitizationRulesText.push(substitute + '=' + rules[substitute].join(','))
            }
            return sanitizationRulesText

        }, (rules) => {
            let optimizedRules = {}
            for (const substitute in rules) {
                optimizedRules[substitute] = Utilities.buildWholeWordMatchingRegex(rules[substitute])
            }
            return optimizedRules
        })
    }

    /**
     * @param {string|null} helpText
     * @protected
     */
    _addItemTextSearchFilter(helpText = null)
    {
        this._configurationManager.addTextField(FILTER_TEXT_SEARCH, helpText ?? 'Show videos with these comma separated words in their names.')
        this._addItemComplianceFilter(FILTER_TEXT_SEARCH, (item, value) => this._get(item, ITEM_NAME).includes(value))
    }

    /**
     * @param {string} helpText
     * @protected
     */
    _addItemWhitelistFilter(helpText)
    {
        this._configurationManager.addRulesetField(
            FILTER_TEXT_WHITELIST, 5, helpText, null, null, (rules) => Utilities.buildWholeWordMatchingRegex(rules))
    }

    /**
     * @param {SubscriptionsFilterExclusionsCallback} exclusionsCallback Add page exclusions here
     * @param {SubscriptionsFilterUsernameCallback} getItemUsername Return username of the item or return false to skip
     * @protected
     */
    _addSubscriptionsFilter(exclusionsCallback, getItemUsername)
    {
        this._configurationManager
            .addFlagField(FILTER_SUBSCRIBED_VIDEOS, 'Hide videos from subscribed channels.')
            .addTextField(STORE_SUBSCRIPTIONS, 'Recorded subscription accounts.')

        this._addItemComplexComplianceFilter(
            FILTER_SUBSCRIBED_VIDEOS,
            (value) => value && this._config.isUserLoggedIn && exclusionsCallback(),
            (item) => {
                let username = getItemUsername(item)
                if (username === false) {
                    return true
                }
                return !(new RegExp('"([^"]*' + username + '[^"]*)"')).test(this._getConfig(STORE_SUBSCRIPTIONS))
            })
    }

    /**
     * @param {JQuery} item
     * @protected
     */
    _complyItem(item)
    {
        let itemComplies = true

        if (!this._getConfig(OPTION_DISABLE_COMPLIANCE_VALIDATION) &&
            this._validateItemWhiteList(item) &&
            Utilities.processEventHandlerQueue(this._onBeforeCompliance, [item], true)
        ) {
            let configField

            for (let complianceFilter of this._complianceFilters) {

                configField = this._configurationManager.getFieldOrFail(complianceFilter.configKey)
                if (complianceFilter.validate(configField.optimized ?? configField.value)) {
                    itemComplies = complianceFilter.comply(item, configField.optimized ?? configField.value)
                    this._statistics.record(complianceFilter.configKey, itemComplies)
                    if (!itemComplies) {
                        break
                    }
                }
            }
        }
        itemComplies ? Utilities.callEventHandler(this._onItemShow, [item]) : Utilities.callEventHandler(this._onItemHide, [item])
        item.css('opacity', 'unset')
    }

    /**
     * Filters items as per settings
     * @param {JQuery} itemsList
     * @param {boolean} fromObserver
     * @protected
     */
    _complyItemsList(itemsList, fromObserver = false)
    {
        let items = fromObserver ?
            itemsList.filter(this._config.itemSelectors).add(itemsList.find(this._config.itemSelectors)) : itemsList.find(this._config.itemSelectors)

        items.css('opacity', 0.75).each((index, element) => {

            let item = $(element)

            // First run processing

            if (this._get(item, ITEM_PROCESSED_ONCE) === null) {
                if (this._sanitizationEnabled) {
                    Validator.sanitizeTextNode(
                        item.find(this._config.itemNameSelector), this._configurationManager.getFieldOrFail(FILTER_TEXT_SANITIZATION).optimized)
                }
                this._itemAttributesResolver.resolveAttributes(item)
                Utilities.processEventHandlerQueue(this._onFirstHitBeforeCompliance, [item])
            }

            // Compliance filtering

            this._complyItem(item)

            // After first run processing

            if (!this._get(item, ITEM_PROCESSED_ONCE)) {
                Utilities.processEventHandlerQueue(this._onFirstHitAfterCompliance, [item])
                this._itemAttributesResolver.set(item, ITEM_PROCESSED_ONCE, true)
            }
        })
        this._statistics.updateUI()
    }

    /**
     * @protected
     * @return {JQuery[]}
     */
    _createPaginationControls()
    {
        return [this._configurationManager.createElement(CONFIG_PAGINATOR_THRESHOLD), this._configurationManager.createElement(CONFIG_PAGINATOR_LIMIT)]
    }

    /**
     * @protected
     * @return {JQuery}
     */
    _createSettingsBackupRestoreFormActions()
    {
        return this._uiGen.createFormActions([
            this._uiGen.createFormButton(
                'Backup Configuration', 'Backup configuration to the clipboard.', () => this._onBackupSettings()),
            this._uiGen.createSeparator(),
            this._uiGen.createFormGroupInput('text')
                .attr('id', 'restore-settings')
                .attr('placeholder', 'Paste settings...'),
            this._uiGen.createFormButton(
                'Restore Configuration', 'Restore configuration from the above field.', () => this._onRestoreSettings()),
        ], 'bv-flex-column');
    }

    /**
     * @protected
     * @return {JQuery}
     */
    _createSettingsFormActions()
    {
        return this._uiGen.createFormActions([
            this._uiGen.createFormButton('Apply', 'Apply settings.', () => this._onApplyNewSettings()),
            this._uiGen.createFormButton('Save', 'Apply and update saved configuration.', () => this._onSaveSettings()),
            this._uiGen.createFormButton('Reset', 'Revert to saved configuration.', () => this._onResetSettings()),
        ]);
    }

    /**
     * @protected
     * @return {JQuery}
     */
    _createSubscriptionLoaderControls()
    {
        let button = this._uiGen.createFormButton('Load Subscriptions', 'Makes a copy of your subscriptions in cache for related filters.', (event) => {
            if (this._config.isUserLoggedIn) {
                $(event.currentTarget).prop('disabled', true)

                this._subscriptionsLoader.run()
            } else {
                this._showNotLoggedInAlert()
            }
        })
        return button.attr('id', 'subscriptions-loader')
    }

    /**
     * @param {JQuery} UISection
     * @private
     */
    _embedUI(UISection)
    {
        UISection.on('mouseleave', (event) => {
            if (!this._getConfig(OPTION_ALWAYS_SHOW_SETTINGS_PANE)) {
                $(event.currentTarget).slideUp(300)
            }
        })
        if (this._getConfig(OPTION_ALWAYS_SHOW_SETTINGS_PANE)) {
            UISection.show()
        }
        this._uiGen.constructor.appendToBody(UISection)
        this._uiGen.constructor.appendToBody(this._uiGen.createSettingsShowButton('', UISection))
    }

    /**
     * @param {JQuery} item
     * @param {string} attributeName
     * @returns {*}
     * @protected
     */
    _get(item, attributeName)
    {
        return this._itemAttributesResolver.get(item, attributeName)
    }

    /**
     * @param {string} config
     * @returns {*}
     * @protected
     */
    _getConfig(config)
    {
        return this._configurationManager.getValue(config)
    }

    /**
     * @private
     */
    _onApplyNewSettings()
    {
        this._configurationManager.update()
        this._validateCompliance()
    }

    /**
     * @private
     */
    _onBackupSettings()
    {
        navigator.clipboard.writeText(this._configurationManager.backup()).then(() => this._uiGen.updateStatus('Settings backed up to clipboard!')).catch(
            () => this._uiGen.updateStatus('Settings backup failed!'))
    }

    /**
     * @param {Function} handler
     * @protected
     */
    _onUIBuild(handler)
    {
        this._onBeforeUIBuild.push(handler)
    }

    /**
     * @param {Function} handler
     * @protected
     */
    _onUIBuilt(handler)
    {
        this._onAfterUIBuild.push(handler)
    }

    /**
     * @private
     */
    _onResetSettings()
    {
        this._configurationManager.revertChanges()
        this._validateCompliance()
    }

    /**
     * @private
     */
    _onRestoreSettings()
    {
        let settings = $('#restore-settings').val().trim()
        if (!settings) {
            this._uiGen.updateStatus('No Settings provided!', true)
            Utilities.sleep(3000).then(() => this._uiGen.resetStatus())
        } else {
            try {
                this._configurationManager.restore(settings)
                this._uiGen.updateStatus('Settings restored!')
                this._validateCompliance()
            } catch (e) {
                this._uiGen.updateStatus('Settings restoration failed!')
            }
        }

    }

    /**
     * @private
     */
    _onSaveSettings()
    {
        this._onApplyNewSettings()
        this._configurationManager.save()
    }

    /**
     * @param {string} configKey
     * @param {function(*)} actionCallback
     * @param {function(*, function?): boolean} validationCallback
     * @returns {BrazenBaseSearchEnhancer}
     * @protected
     */
    _performComplexOperation(configKey, validationCallback, actionCallback)
    {
        return this._performOperation(configKey, actionCallback, validationCallback)
    }

    /**
     * @param {string} configKey
     * @param {function(*)} actionCallback
     * @param {function(*, function?): boolean|null} validationCallback
     * @returns {BrazenBaseSearchEnhancer}
     * @protected
     */
    _performOperation(configKey, actionCallback, validationCallback = null)
    {
        let configField = this._configurationManager.getField(configKey)
        let defaultValidationCallback = this._configurationManager.generateValidationCallback(configKey)
        let validationCallbackParams
        let values = configField.optimized ?? configField.value

        if (validationCallback) {
            validationCallbackParams = [values, defaultValidationCallback]
        } else {
            validationCallbackParams = [values]
            validationCallback = defaultValidationCallback
        }
        if (Utilities.callEventHandler(validationCallback, validationCallbackParams, true)) {
            actionCallback(values)
        }
        return this
    }

    /**
     * @param {string} flagConfigKey
     * @param {string} configKey
     * @param {function(*)} actionCallback
     * @param {function(*, function?): boolean} validationCallback
     * @returns {BrazenBaseSearchEnhancer}
     * @protected
     */
    _performTogglableComplexOperation(flagConfigKey, configKey, validationCallback, actionCallback)
    {
        if (this._configurationManager.getValue(flagConfigKey)) {
            this._performComplexOperation(configKey, validationCallback, actionCallback)
        }
        return this
    }

    /**
     * @param {string} flagConfigKey
     * @param {string} configKey
     * @param {function(*)} actionCallback
     * @param {function(*, function?): boolean|null} validationCallback
     * @returns {BrazenBaseSearchEnhancer}
     * @protected
     */
    _performTogglableOperation(flagConfigKey, configKey, actionCallback, validationCallback = null)
    {
        if (this._configurationManager.getValue(flagConfigKey)) {
            this._performOperation(configKey, actionCallback, validationCallback)
        }
        return this
    }

    /**
     * @param {boolean} enableCondition
     * @param {PaginatorConfiguration} configuration
     * @protected
     */
    _setupPaginator(enableCondition, configuration)
    {
        if (enableCondition) {
            configuration.itemSelectors = this._config.itemSelectors
            this._paginator = new BrazenPaginator(configuration)
        }
        this._configurationManager
            .addNumberField(CONFIG_PAGINATOR_LIMIT, 1, 50, 'Limit paginator to concatenate the specified number of maximum pages.')
            .addNumberField(CONFIG_PAGINATOR_THRESHOLD, 1, 1000, 'Make paginator ensure the specified number of minimum results.')
    }

    /**
     * @return {BrazenSubscriptionsLoader}
     * @protected
     */
    _setupSubscriptionLoader()
    {
        this._subscriptionsLoader =
            new BrazenSubscriptionsLoader((status) => this._uiGen.updateStatus(status), (subscriptions) => {
                this._configurationManager.getField(STORE_SUBSCRIPTIONS).value = subscriptions.length ? '"' + subscriptions.join('""') + '"' : ''
                this._configurationManager.save()
                $('#subscriptions-loader').prop('disabled', false)
            })
        return this._subscriptionsLoader
    }

    /**
     * @protected
     */
    _showNotLoggedInAlert()
    {
        alert('You need to be logged in to use this functionality')
    }

    /**
     * @param {boolean} firstRun
     * @protected
     */
    _validateCompliance(firstRun = false)
    {
        let itemLists = $(this._config.itemListSelectors)
        if (!firstRun) {
            this._statistics.reset()
            itemLists.each((index, itemsList) => {
                this._complyItemsList($(itemsList))
            })
        } else {
            itemLists.each((index, itemList) => {
                let itemListObject = $(itemList)

                if (this._paginator && itemListObject.is(this._paginator.getItemListSelector())) {

                    ChildObserver.create()
                        .onNodesAdded((itemsAdded) => {
                            this._complyItemsList($(itemsAdded), true)
                            this._paginator.run(this._getConfig(CONFIG_PAGINATOR_THRESHOLD), this._getConfig(CONFIG_PAGINATOR_LIMIT))
                        })
                        .observe(itemList)

                } else {
                    ChildObserver.create()
                        .onNodesAdded((itemsAdded) => {
                            this._complyItemsList($(itemsAdded), true)
                        })
                        .observe(itemList)
                }

                this._complyItemsList(itemListObject)
            })
        }
        if (this._paginator) {
            this._paginator.run(this._getConfig(CONFIG_PAGINATOR_THRESHOLD), this._getConfig(CONFIG_PAGINATOR_LIMIT))
        }
        Utilities.processEventHandlerQueue(this._onAfterComplianceRun)
        this._itemAttributesResolver.completeResolutionRun()
    }

    /**
     * @param {JQuery} item
     * @return {boolean}
     * @protected
     */
    _validateItemWhiteList(item)
    {
        let field = this._configurationManager.getField(FILTER_TEXT_WHITELIST)
        if (field) {
            let validationResult = field.value.length ? Validator.regexMatches(this._get(item, ITEM_NAME), field.optimized) : true
            this._statistics.record(FILTER_TEXT_WHITELIST, validationResult)
            return validationResult
        }
        return true
    }

    /**
     * Initialize the script and do basic UI removals
     */
    init()
    {
        if (Utilities.callEventHandler(this._onValidateInit)) {

            this._configurationManager.initialize(this._config.scriptPrefix)

            this._itemAttributesResolver
                .addAttribute(ITEM_NAME, (item) => item.find(this._config.itemNameSelector).text())
                .addAttribute(ITEM_PROCESSED_ONCE, () => false)

            if (this._paginator) {
                this._paginator.initialize()
            }

            Utilities.processEventHandlerQueue(this._onBeforeUIBuild)
            this._embedUI(this._uiGen.createSettingsSection().append(this._userInterface))
            Utilities.processEventHandlerQueue(this._onAfterUIBuild)

            this._configurationManager.updateInterface()

            this._validateCompliance(true)

            this._uiGen.updateStatus('Initial run completed.')

            Utilities.processEventHandlerQueue(this._onAfterInitialization)
        }
    }

    /**
     * @returns {boolean}
     */
    isUserLoggedIn()
    {
        return this._config.isUserLoggedIn
    }
}