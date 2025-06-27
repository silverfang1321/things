// ==UserScript==
// @name         Brazen UI Generator
// @namespace    brazenvoid
// @version      2.0.17 // Incrementing version for changes
// @author       brazenvoid
// @license      GPL-3.0-only
// @description  Helper methods to generate a control panel UI for scripts
// @grant        GM_addStyle
// @match        https://hitomi.la/* // Adding match patterns for hitomi.la
// ==/UserScript==

/**
 * @function GM_addStyle
 * @param {string} style
 */
GM_addStyle(`
@keyframes brazen-fade {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Base styles for the UI container */
.brazen-ui-container {
    position: absolute; /* Will be overridden by specific page rules */
    background-color: #333; /* Darker background for "downloader script" feel */
    border: 1px solid #555; /* Subtle border */
    border-radius: 6px;
    padding: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    z-index: 9999; /* Ensure it's on top */
    color: #eee; /* Light text color */
    font-family: 'Segoe UI', Arial, sans-serif; /* Modern, readable font */
    font-size: 14px;
    width: 280px; /* Fixed width for consistency */
    box-sizing: border-box; /* Include padding/border in width */
    max-height: 90vh; /* Prevent overflow on smaller screens */
    overflow-y: auto; /* Scroll if content is too long */
    display: flex;
    flex-direction: column;
}

/* Specific positioning for hitomi.la tag pages */
body.hitomi-tag-page .brazen-ui-container {
    position: fixed; /* Fixed position for scrolling */
    top: 10px;
    right: 10px;
}

/* Specific positioning for hitomi.la post pages */
body.hitomi-post-page .brazen-ui-container {
    position: absolute; /* Relative to its parent, then moved with flex/grid */
    margin-top: 10px; /* Space from the related galleries title */
    align-self: flex-start; /* Align to the start in a flex container */
}


#restore-settings.bv-input{margin-bottom:1rem}
#settings-wrapper{
    /* These styles are mostly overridden by .brazen-ui-container */
    bottom:5vh;
    overflow:auto;
    resize:horizontal;
    top:5vh;
    z-index:1001;
    min-width: 250px; /* Ensure a minimum width for readability */
}
.show-settings.bv-section{
    top:5vh;
    box-shadow:0 0 10px rgba(0,0,0,0.5); /* Softer shadow */
    padding:6px 10px; /* Adjusted padding */
    border-radius:4px;
    border:1px solid #666; /* Subtler border */
    background-color: #555; /* Consistent dark background */
    color: #eee; /* Light text color */
    font-size: 0.85rem; /* Slightly smaller font */
    left: 0; /* Keep it on the left */
    width: auto; /* Let content dictate width */
    writing-mode: unset; /* Revert writing mode for horizontal text */
    height: auto; /* Auto height */
    text-align: center; /* Center the text */
}
.bv-actions{
    display:flex; /* Changed to flex for better button alignment */
    justify-content: space-around; /* Distribute space evenly */
    padding:0.25rem 0; /* Adjusted padding */
    gap: 8px; /* Space between buttons */
}
.bv-actions .bv-button{
    flex-grow: 1; /* Allow buttons to grow and fill space */
    width: auto; /* Override fixed width */
    background-color: #007bff; /* Primary action color */
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.1s ease;
}
.bv-actions .bv-button:hover{
    background-color: #0056b3;
    transform: translateY(-1px);
}
.bv-actions .bv-button:active{
    transform: translateY(0);
}

.bv-bg-colour{background-color:transparent;} /* Remove explicit background as container has it */
.bv-border-primary{border:1px solid #666;} /* Consistent border color */
.bv-break{margin:0.5rem 0; border-top: 1px dashed #666;} /* Dashed separator */
.bv-button{
    background-color: #5cb85c; /* Default button color */
    color: white;
    padding:0.5rem 1rem;
    width:100%;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s ease;
}
.bv-button:hover{
    background-color: #4cae4c;
}

.bv-flex-column{flex-direction:column}
.bv-font-primary{color:#eee} /* Light primary font color */
.bv-font-secondary{color:#ccc} /* Slightly darker secondary font color */

.bv-group{align-items:center;display:flex;min-height:20px; margin-bottom: 8px;} /* Add bottom margin for spacing */
.bv-group + .bv-group{margin-top:0.5rem} /* Reduced margin between groups */
.bv-group.bv-range-group,.bv-group.bv-text-group{align-items:center}
.bv-group.bv-range-group > input{width:75px}
.bv-group.bv-range-group > input + input{margin-left:5px}
.bv-group.bv-textarea-group{align-items:start;flex-direction:column;overflow:hidden}
.bv-group.bv-textarea-group > textarea.bv-input{margin-top:0.5rem;resize:vertical;width:100%; min-height: 60px;} /* Min height for text areas */
input.bv-input,select.bv-input,textarea.bv-input{
    box-sizing:border-box;
    margin:0;
    padding:0.4rem 0.6rem; /* Slightly reduced padding */
    border: 1px solid #666;
    background-color: #444; /* Darker input background */
    color: #eee; /* Light text in inputs */
    border-radius: 3px;
}
input.bv-input:focus, select.bv-input:focus, textarea.bv-input:focus {
    outline: none;
    border-color: #007bff; /* Highlight on focus */
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}
.bv-input.bv-checkbox-radio{margin-right:5px;scale:1.2;} /* Slightly smaller scale for checkboxes/radios */
.bv-input.bv-text{width:100%}
.bv-label{flex-grow:1;text-align:start; padding-right: 10px; /* Space between label and input */}
.bv-label.bv-text + .bv-input.bv-text{width:40%}
.bv-section{
    display:flex;
    flex-direction:column;
    font-family:"Segoe UI", Arial, sans-serif; /* Consistent font */
    font-size:1rem;
    font-weight:normal;
    /* Position properties handled by .brazen-ui-container */
    padding:0; /* Remove section padding, container handles it */
    z-index:1000;
}
.bv-section > div + div{margin-top:1rem}
.bv-section hr{border:1px solid #666;margin:1rem 0} /* Consistent separator style */
.bv-section button + button{margin-left:0.25rem}
.bv-section .bv-title{
    display:block;
    height:auto; /* Auto height for title */
    margin-bottom:0.75rem; /* Reduced margin */
    text-align:center;
    width:100%;
    font-size: 1.1em;
    font-weight: bold;
    color: #007bff; /* Highlight title */
    border-bottom: 1px solid #444; /* Separator under title */
    padding-bottom: 5px;
}
.bv-show-settings{
    border:0;
    font-size:0.7rem;
    height:90vh;
    left:0;
    margin:0;
    padding:0;
    position:fixed;
    top:5vh;
    width:0.2vw;
    writing-mode:sideways-lr;
    z-index:999
}
.bv-show-settings .bv-title{display:block;height:20px;width:100%}
.bv-tab-button{
    background-color:#555; /* Darker tab button */
    border-bottom:0;
    border-top-left-radius:3px;
    border-top-right-radius:3px;
    cursor:pointer;
    outline:none;
    padding:0.5rem 0.75rem;
    transition:0.3s;
    color: #eee;
    border: 1px solid #666; /* Consistent border */
    border-bottom: none; /* No bottom border for tabs */
}
.bv-tab-button.bv-active,.bv-tab-button:hover{
    color:#fff; /* White text on active/hover */
    background-color:#007bff; /* Blue active/hover background */
    border-color: #007bff;
}
.bv-tab-panel{
    animation:brazen-fade 0.5s ease-in-out; /* Faster, smoother fade */
    display:none;
    flex-direction:column;
    padding:1rem;
    background-color: #444; /* Darker panel background */
    border-radius: 0 0 6px 6px; /* Rounded bottom corners */
    border-top: none; /* No top border */
    margin-top: -1px; /* Overlap with tab nav border */
}
.bv-tab-panel.bv-active{display:flex}
.bv-tabs-nav{
    display:flex;
    flex-wrap:wrap;
    overflow:hidden;
    margin-bottom: 0; /* No margin below nav */
}
`)

class BrazenUIGenerator
{
    /**
     * @param {JQuery} nodes
     */
    static appendToBody(nodes)
    {
        // Add a class to the body to help with CSS targeting based on page type
        if (window.location.href.includes('hitomi.la/tag/')) {
            $('body').addClass('hitomi-tag-page');
        } else if (window.location.href.includes('hitomi.la/doujinshi/') ||
                   window.location.href.includes('hitomi.la/manga/') ||
                   window.location.href.includes('hitomi.la/cg/') ||
                   window.location.href.includes('hitomi.la/gamecg/') ||
                   window.location.href.includes('hitomi.la/imageset/')) {
            $('body').addClass('hitomi-post-page');
        }

        // Delay appending to ensure the target element exists for post pages
        if ($('body').hasClass('hitomi-post-page')) {
            const targetSelector = '.list-title:has(h3:contains("Related Galleries"))';
            const appendInterval = setInterval(() => {
                const targetElement = $(targetSelector);
                if (targetElement.length) {
                    clearInterval(appendInterval);
                    // Append the nodes after the target element
                    targetElement.after(nodes);
                }
            }, 100); // Check every 100ms
        } else {
            // For tag pages or other pages, append to body as before (but using the new container class)
            $('body').append(nodes);
        }
    }

    /**
     * @param {string} selectorPrefix
     */
    constructor(selectorPrefix)
    {
        /**
         * @type {JQuery}
         * @private
         */
        this._section = null

        /**
         * @type {SelectorGenerator}
         * @private
         */
        this._selectorGenerator = new SelectorGenerator(selectorPrefix)

        /**
         * @type {string}
         * @private
         */
        this._selectorPrefix = selectorPrefix

        /**
         * @type {JQuery}
         * @private
         */
        this._statusLine = null

        /**
         * @type {string}
         * @private
         */
        this._statusText = ''
    }

    /**
     * @param {JQuery} node
     * @param {string} text
     * @return {JQuery}
     * @private
     */
    _addHelpTextOnHover(node, text)
    {
        if (text !== '') {
            node.on('mouseover', () => this.updateStatus(text, true))
            node.on('mouseout', () => this.resetStatus())
        }
        return node
    }

    /**
     * @return {JQuery}
     */
    createBreakSeparator()
    {
        return $('<hr class="bv-break"/>') // Changed to <hr> for better semantic and styling control
    }

    /**
     * @return {JQuery}
     */
    createContainer()
    {
        // Renamed and restyled for the new fixed position approach
        this._section = $('<div class="brazen-ui-container">'); // Changed to div
        return this._section;
    }

    /**
     * @param {JQuery|JQuery[]} children
     * @param {string} wrapperClasses
     * @return {JQuery}
     */
    createFormActions(children, wrapperClasses = '')
    {
        return $('<div class="bv-actions"/>').addClass(wrapperClasses).append(children)
    }

    /**
     * @param {string} caption
     * @param {JQuery.EventHandler} onClick
     * @param {string} hoverHelp
     * @return {JQuery}
     */
    createFormButton(caption, hoverHelp, onClick)
    {
        let button = $('<button class="bv-button">').text(caption).on('click', onClick)
        return this._addHelpTextOnHover(button, hoverHelp)
    }

    createFormCheckBoxesGroupSection(label, keyValuePairs, hoverHelp)
    {
        let section = this.createFormSection(label).addClass('bv-checkboxes-group')
        for (const element of keyValuePairs) {
            section.append(
                this.createFormGroup().append([
                    this.createFormGroupLabel(element[0], 'checkbox'),
                    this.createFormGroupInput('checkbox').attr('data-value', element[1]),
                ]),
            )
        }
        return this._addHelpTextOnHover(section, hoverHelp)
    }

    /**
     * @return {JQuery}
     */
    createFormGroup()
    {
        return $('<div class="bv-group"/>')
    }

    /**
     * @param {string} id
     * @param {Array} keyValuePairs
     *
     * @return {JQuery}
     */
    createFormGroupDropdown(id, keyValuePairs)
    {
        let dropdown = $('<select>').attr('id', id).addClass('bv-input')

        for (let i = 0; i < keyValuePairs.length; i++) {
            dropdown.append($('<option>').attr('value', keyValuePairs[i][0]).text(keyValuePairs[i][1]).prop('selected', (i === 0)))
        }
        return dropdown
    }

    /**
     * @param {string} type
     *
     * @return {JQuery}
     */
    createFormGroupInput(type)
    {
        let input = $('<input class="bv-input">').attr('type', type)
        switch (type) {
            case 'number':
            case 'text':
                input.addClass('bv-text')
                break

            case 'radio':
            case 'checkbox':
                input.addClass('bv-checkbox-radio')
                break
        }
        return input
    }

    /**
     * @param {string} label
     * @param {string} inputType
     * @return {JQuery}
     */
    createFormGroupLabel(label, inputType = '')
    {
        let labelFormGroup = $('<label class="bv-label">').text(label)
        if (inputType !== '') {
            switch (inputType) {
                case 'number':
                case 'text':
                    labelFormGroup.addClass('bv-text')
                    labelFormGroup.text(labelFormGroup.text() + ': ')
                    break
                case 'radio':
                case 'checkbox':
                    labelFormGroup.addClass('bv-checkbox-radio')
                    break
            }
        }
        return labelFormGroup
    }

    /**
     * @param {string} statisticType
     * @return {JQuery}
     */
    createFormGroupStatLabel(statisticType)
    {
        return $('<label class="bv-stat-label">').attr('id', this._selectorGenerator.getStatLabelSelector(statisticType)).text('0')
    }

    /**
     * @param {string} label
     * @param {string} inputType
     * @param {string} hoverHelp
     * @return {JQuery}
     */
    createFormInputGroup(label, inputType, hoverHelp = '')
    {
        return this._addHelpTextOnHover(
            this.createFormGroup().append([
                this.createFormGroupLabel(label, inputType),
                this.createFormGroupInput(inputType),
            ]),
            hoverHelp,
        )
    }

    createFormRadiosGroupSection(label, keyValuePairs, hoverHelp)
    {
        let section = this.createFormSection(label).addClass('bv-radios-group')
        for (let i = 0; i < keyValuePairs.length; i++) {
            section.append(
                this.createFormGroup().append([
                    this.createFormGroupLabel(keyValuePairs[i][0], 'radio'),
                    this.createFormGroupInput('radio').prop('checked', i === 0).attr('data-value', keyValuePairs[i][1]).on('change', (event) => {
                        $(event.currentTarget).parents('.bv-radios-group').first().find('input').each((index, element) => {
                            if (!element.isSameNode(event.currentTarget)) {
                                $(element).prop('checked', false)
                            }
                        })
                    }),
                ]),
            )
        }
        return this._addHelpTextOnHover(section, hoverHelp)
    }

    /**
     * @param {string} label
     * @param {string} inputsType
     * @param {number} minimum
     * @param {number} maximum
     * @param {string} hoverHelp
     * @return {JQuery}
     */
    createFormRangeInputGroup(label, inputsType, minimum, maximum, hoverHelp)
    {
        return this._addHelpTextOnHover(
            this.createFormGroup().addClass('bv-range-group').append([
                this.createFormGroupLabel(label, inputsType),
                this.createFormGroupInput(inputsType).attr('min', minimum).attr('max', maximum),
                this.createFormGroupInput(inputsType).attr('min', minimum).attr('max', maximum),
            ]),
            hoverHelp,
        )
    }

    /**
     * @param {string} title
     * @return {JQuery}
     */
    createFormSection(title = '')
    {
        return $('<div>').append($('<label class="bv-title">').text(title))
    }

    /**
     * @param {string} label
     * @param {int} rows
     * @param {string} hoverHelp
     * @return {JQuery}
     */
    createFormTextAreaGroup(label, rows, hoverHelp = '')
    {
        return this._addHelpTextOnHover(
            this.createFormGroup().addClass('bv-textarea-group').append([
                this.createFormGroupLabel(label),
                $('<textarea class="bv-input" spellcheck="false">').attr('rows', rows),
            ]),
            hoverHelp,
        )
    }

    /**
     * @return {JQuery}
     */
    createSeparator()
    {
        return $('<hr/>')
    }

    /**
     * @return {JQuery}
     */
    createSettingsHideButton()
    {
        return this.createFormButton('<< Hide', '', () => this._section.css('display', 'none'))
    }

    /**
     * @return {JQuery}
     */
    createSettingsSection()
    {
        // Now using the new base container class
        return this.createContainer()
            .attr('id', 'settings-wrapper')
            .hide(); // Keep it hidden by default
    }

    /**
     * @param {string} caption
     * @param {JQuery} settingsSection
     *
     * @return {JQuery}
     */
    createSettingsShowButton(caption, settingsSection)
    {
        // Adjust show button class and appearance
        return $('<button class="bv-show-settings bv-button">') // Use bv-button for consistent styling
            .text(caption)
            .on('click', () => settingsSection.slideDown(300))
    }

    /**
     * @param {string} statisticsType
     * @param {string} label
     * @return {JQuery}
     */
    createStatisticsFormGroup(statisticsType, label = '')
    {
        return this.createFormGroup().addClass('bv-stat-group').append([
            this.createFormGroupLabel((label === '' ? statisticsType : label) + ' Filter'),
            this.createFormGroupStatLabel(statisticsType),
        ])
    }

    /**
     * @return {JQuery}
     */
    createStatisticsTotalsGroup()
    {
        return this.createFormGroup().append([
            this.createFormGroupLabel('Total'),
            this.createFormGroupStatLabel('Total'),
        ])
    }

    /**
     * @return {JQuery}
     */
    createStatusSection()
    {
        this._statusLine = this.createFormGroupLabel('Status').attr('id', this._selectorGenerator.getSelector('status'))
        return this._statusLine
    }

    /**
     * @param {string} tabName
     * @param {boolean} isFirst
     * @return {JQuery}
     */
    createTabButton(tabName, isFirst)
    {
        let tabButton = $('<button class="bv-tab-button bv-border-primary">')
            .text(tabName)
            .on('click', (event) => {

                let button = $(event.currentTarget)
                let tabSection = button.parents('.bv-tabs-section:first')

                tabSection.find('.bv-tab-button')
                    .removeClass('bv-active') // Removed bv-font-secondary/primary classes from here, handled by general rules
                    .css('background-color', '#555') // Reset background for inactive tabs
                    .css('color', '#eee'); // Reset text color for inactive tabs

                tabSection.find('.bv-tab-panel').removeClass('bv-active')

                button.addClass('bv-active')
                    .css('background-color', '#007bff') // Active tab background
                    .css('color', '#fff'); // Active tab text color

                $('#' + Utilities.toKebabCase(button.text())).addClass('bv-active')
            })
            // Removed mouseenter/mouseleave from JS, handled by CSS :hover
        return isFirst ? tabButton.addClass('bv-active').css('background-color', '#007bff').css('color', '#fff') : tabButton.css('background-color', '#555').css('color', '#eee');
    }

    /**
     * @param {string} tabName
     * @param {boolean} isFirst
     * @return {JQuery}
     */
    createTabPanel(tabName, isFirst = false)
    {
        let tabPanel = $('<div class="bv-tab-panel bv-border-primary">').attr('id', Utilities.toKebabCase(tabName))
        if (isFirst) {
            tabPanel.addClass('bv-active')
        }
        return tabPanel
    }

    /**
     * @param {string[]} tabNames
     * @param {JQuery[]} tabPanels
     * @return {JQuery}
     */
    createTabsSection(tabNames, tabPanels)
    {
        let tabButtons = []
        for (let i = 0; i < tabNames.length; i++) {
            tabButtons.push(this.createTabButton(tabNames[i], i === 0))
        }
        let nav = $('<div class="bv-tabs-nav">').append(tabButtons)
        return $('<div class="bv-tabs-section">').append(nav).append(...tabPanels)
    }

    /**
     * @return {JQuery}
     */
    getSelectedSection()
    {
        return this._section
    }

    resetStatus()
    {
        this._statusLine.text(this._statusText)
    }

    /**
     * @param {string} status
     * @param {boolean} transient
     */
    updateStatus(status, transient = false)
    {
        if (!transient) {
            this._statusText = status
        }
        this._statusLine.text(status)
    }
}

// Ensure SelectorGenerator and Utilities are defined or included elsewhere in your script.
// Assuming they are defined like this:

class SelectorGenerator {
    constructor(prefix) {
        this.prefix = prefix;
    }
    getSelector(id) {
        return `${this.prefix}-${id}`;
    }
    getStatLabelSelector(type) {
        return `${this.prefix}-stat-${type}`;
    }
}

class Utilities {
    static toKebabCase(text) {
        return text.toLowerCase().replace(/\s/g, '-');
    }
}