// ==UserScript==
// @name         Brazen UI Generator (Revamped)
// @namespace    brazenvoid
// @version      3.0.0
// @author       brazenvoid
// @license      GPL-3.0-only
// @description  UI panel generator with inline button injection
// @grant        GM_addStyle
// ==/UserScript==

class BrazenUIGenerator
{
    /**
     * @param {JQuery} nodes
     */
    static appendToBody(nodes)
    {
        $('body').append(nodes)
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
        return $('<br class="bv-break"/>')
    }

    /**
     * @return {JQuery}
     */
    createContainer()
    {
        this._section = $('<section class="bv-section bv-font-primary">')
        return this._section
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
        return this.createContainer()
            .attr('id', 'settings-wrapper')
            .addClass('bv-bg-colour bv-border-primary')
            .hide()
    }

    /**
     * @param {string} caption
     * @param {JQuery} settingsSection
     *
     * @return {JQuery}
     */
    createSettingsShowButton(caption, settingsSection)
    {
        return $('<button class="show-settings bv-section bv-bg-colour">')
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
                    .removeClass('bv-active bv-font-secondary')
                    .addClass('bv-font-primary')

                tabSection.find('.bv-tab-panel').removeClass('bv-active')

                button.removeClass('bv-font-primary').addClass('bv-active bv-font-secondary')

                $('#' + Utilities.toKebabCase(button.text())).addClass('bv-active')
            })
            .on('mouseenter', (event) => $(event.currentTarget).addClass('bv-font-secondary'))
            .on('mouseleave', (event) => $(event.currentTarget).removeClass('bv-font-secondary'))

        return isFirst ? tabButton.addClass('bv-active bv-font-secondary') : tabButton.addClass('bv-font-primary')
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

  _buildPanel(title) {
    const panel = $(`
      <div class="bv-panel">
        <div class="bv-header">
          <h2>${title}</h2>
          <button class="bv-close">&times;</button>
        </div>
        <div class="bv-content"></div>
      </div>
    `);
    panel.find('.bv-close').on('click', () => panel.hide());
    return panel;
  }

  toggle() {
    this._panel.toggle();
  }

  appendSettingsButtonTo(selector, buttonText = '⚙ Settings') {
    const container = $(selector).first();
    if (!container.length) return this;
    const btn = $('<button>')
      .addClass('bv-button bv-inject-btn')
      .text(buttonText)
      .on('click', () => this.toggle());
    container.append(btn);
    return this;
  }

  addInput(id, label, type = 'text', placeholder = '', defaultValue = '') {
    const group = $('<div>').addClass('bv-group');
    group.append($('<label>').attr('for', id).text(label));
    const input = $('<input>')
      .attr({ id, type, placeholder })
      .val(defaultValue);
    group.append(input);
    this._content.append(group);
    return this;
  }

  addTextarea(id, label, rows = 3, placeholder = '') {
    const group = $('<div>').addClass('bv-group');
    group.append($('<label>').attr('for', id).text(label));
    const ta = $('<textarea>')
      .attr({ id, rows, placeholder });
    group.append(ta);
    this._content.append(group);
    return this;
  }

  addSelect(id, label, options = []) {
    const group = $('<div>').addClass('bv-group');
    group.append($('<label>').attr('for', id).text(label));
    const sel = $('<select>').attr('id', id);
    for (const [val, text] of options) {
      sel.append($('<option>').attr('value', val).text(text));
    }
    group.append(sel);
    this._content.append(group);
    return this;
  }

  addCheckbox(id, label, defaultChecked = false) {
    const group = $('<div>').addClass('bv-group');
    const cb = $('<input>').attr({ type: 'checkbox', id }).prop('checked', defaultChecked);
    const lbl = $('<label>').attr('for', id).text(label);
    group.append(lbl.prepend(cb));
    this._content.append(group);
    return this;
  }

  addActionButtons(buttons = []) {
    const wrap = $('<div>').addClass('bv-actions');
    buttons.forEach(({ text, cb }) => {
      wrap.append($('<button>').addClass('bv-button').text(text).on('click', cb));
    });
    this._content.append(wrap);
    return this;
  }

  getValue(id) {
    return this._content.find('#' + id).val();
  }

  getChecked(id) {
    return this._content.find('#' + id).prop('checked');
  }

  show() {
    this._panel.show();
    return this;
  }

  hide() {
    this._panel.hide();
    return this;
  }
}

    /**
     * @param {JQuery} nodes
     */
    static appendToBody(nodes)
    {
        $('body').append(nodes)
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
        return $('<br class="bv-break"/>')
    }

    /**
     * @return {JQuery}
     */
    createContainer()
    {
        this._section = $('<section class="bv-section bv-font-primary">')
        return this._section
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
        return this.createContainer()
            .attr('id', 'settings-wrapper')
            .addClass('bv-bg-colour bv-border-primary')
            .hide()
    }

    /**
     * @param {string} caption
     * @param {JQuery} settingsSection
     *
     * @return {JQuery}
     */
    createSettingsShowButton(caption, settingsSection)
    {
        return $('<button class="show-settings bv-section bv-bg-colour">')
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
                    .removeClass('bv-active bv-font-secondary')
                    .addClass('bv-font-primary')

                tabSection.find('.bv-tab-panel').removeClass('bv-active')

                button.removeClass('bv-font-primary').addClass('bv-active bv-font-secondary')

                $('#' + Utilities.toKebabCase(button.text())).addClass('bv-active')
            })
            .on('mouseenter', (event) => $(event.currentTarget).addClass('bv-font-secondary'))
            .on('mouseleave', (event) => $(event.currentTarget).removeClass('bv-font-secondary'))

        return isFirst ? tabButton.addClass('bv-active bv-font-secondary') : tabButton.addClass('bv-font-primary')
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
