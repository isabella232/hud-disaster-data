import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import _ from 'lodash'
import es6Promise from 'es6-promise'
// import magic from '@/bus'
import numeral from 'numeral'
es6Promise.polyfill()
Vue.use(Vuex)

/**
* Manages the state for client functions.
* @module reportStore
*/
const conversionList = [
  {column: 'numberOfRecords', text: 'Number of households affected', format: '0,0', selected: true},
  {column: 'totalDamageSum', text: 'Total FEMA verified real property loss', format: '$0,0.00', selected: true},
  {column: 'hudUnmetNeedSum', text: 'HUD estimated unmet need', format: '$0,0.00', selected: true},
  {column: 'householdSizeSum', text: 'Household size', format: '0,0', selected: false},
  {column: 'dependentSum', text: 'Dependents', format: '0,0', selected: false},
  {column: 'incomeSum', text: 'Income', format: '$0,0.00', selected: false},
  {column: 'hazardInsuranceSum', text: 'Hazard insurance', format: '$0,0.00', selected: false},
  {column: 'flowInsuranceSum', text: 'Flood insurance', format: '$0,0.00', selected: false},
  {column: 'otherInsuranceSum', text: 'Other insurance', format: '$0,0.00', selected: false},
  {column: 'realPropertyLossSum', text: 'Real property loss', format: '$0,0.00', selected: false},
  {column: 'floodDamageSum', text: 'Flood damage', format: '$0,0.00', selected: false},
  {column: 'foundationDamageSum', text: 'Foundation damage', format: '$0,0.00', selected: false},
  {column: 'roofDamageSum', text: 'Roof damage', format: '$0,0.00', selected: false},
  {column: 'temporaryShelterReceivedSum', text: 'Temp shelter received', format: '$0,0.00', selected: false},
  {column: 'rentAssistanceSum', text: 'Rent assistance', format: '$0,0.00', selected: false},
  {column: 'repairSum', text: 'Repair', format: '$0,0.00', selected: false},
  {column: 'replacementSum', text: 'Replacement', format: '$0,0.00', selected: false},
  {column: 'sbaReceivedSum', text: 'SBA received', format: '$0,0.00', selected: false},
  {column: 'personalPropertyAssistanceSum', text: 'Personal property assistance', format: '$0,0.00', selected: false},
  {column: 'otherAssistanceSum', text: 'Other assistance', format: '$0,0.00', selected: false},
  {column: 'totalAssistanceSum', text: 'Total assistance', format: '$0,0.00', selected: false}
]

export const mutations = {
/**
  Update the disaster number list with fresh data
  @function updateReportDisasterList
  @param {Array} list - A list of disasters
  */
  updateReportDisasterList: function (state, list) {
    console.log(`inside updateReportDisasterList with ${JSON.stringify(_.map(list, d => d.disasterNumber))}`)
    state.disasterList = _.map(list, disaster => {
      let name = `${disaster.disasterType}-${disaster.disasterNumber}-${disaster.state}`
      return {name, code: name, data: disaster}
    })
  },

  setShowReport: function (state, value) {
    state.showReport = value
  },

  setShowReportSpinner: function (state, value) {
    state.showReportSpinner = value
  },

  updateLocaleList: function (state, list) {
    state.localeList = list
  },

  initStore: function (state, stateVal) {
    console.log('inside initStore with: ' + JSON.stringify(stateVal))
    state.disasterList = []
    state.localeList = []
    state.geographicLevel = null
    state.summaryRecords = []
    state.showReport = false
    state.showReportSpinner = false
    state.stateFilter = stateVal
  },

  setState: function (state, chosenState) {
    state.stateFilter = chosenState
  },

  addDisasterFilter: function (state, chosenDisaster) {
    console.log('inside addDisasterFilter')
    chosenDisaster.selected = true
    let index = state.disasterList.indexOf(chosenDisaster)
    state.disasterList.splice(index, 1, chosenDisaster)
  },

  addLocaleFilter: function (state, chosenLocale) {
    console.log('inside addLocaleFilter')
    chosenLocale.selected = true
    let index = state.localeList.indexOf(chosenLocale)
    state.localeList.splice(index, 1, chosenLocale)
  },

  removeDisasterFilter: function (state, disaster) {
    disaster.selected = false
    let index = _.findIndex(state.disasterList, {code: disaster.code})
    state.disasterList.splice(index, 1, disaster)
  },

  removeLocaleFilter: function (state, locale) {
    locale.selected = false
    let index = _.findIndex(state.localeList, {code: locale.code})
    state.localeList.splice(index, 1, locale)
  },

  setSelectedGeographicLevel: function (state, selectedGeographicLevel) {
    state.geographicLevel = selectedGeographicLevel
  },

  setLocalesFilter: function (state, locales) {
    console.log(`inside setLocalesFilter`)
    _.map(locales, l => {
      let chosenLocale = {code: l, name: l}
      let index = _.findIndex(state.localeList, chosenLocale)
      chosenLocale.selected = true
      state.localeList.splice(index, 1, chosenLocale)
    })
  },

  setDisastersFilter: function (state, disasters) {
    console.log(`inside setDisastersFilter`)
    _.map(disasters, d => {
      let chosenDisaster = {code: d, name: d}
      let index = _.findIndex(state.disasterList, chosenDisaster)
      chosenDisaster.selected = true
      state.disasterList.splice(index, 1, chosenDisaster)
    })
  },

  updateReportData: function (state, data) {
    let newSummaryRecord = []
    for (var key in data) {
      let newObj = {}
      let value = data[key]
      let matchingColumn = _.find(conversionList, ['column', key])
      if (matchingColumn) {
        newObj.name = matchingColumn.text
        newObj.column = key
        newObj.value = matchingColumn.format ? numeral(value).format(matchingColumn.format) : value
      } else {
        newObj.name = key
        newObj.column = key
        newObj.value = value
      }
      newSummaryRecord.push(newObj)
    }
    state.summaryRecords = newSummaryRecord
  },

  setSummaryColumn: function (state, selectedCol) {
    let index = _.findIndex(state.summaryColumns, ['column', selectedCol.column])
    state.summaryColumns.splice(index, 1, selectedCol)
  }
}
/**
These are the vuex actions
*/
export const actions = {
  loadFilteredDisasters: function ({ commit, state }) {
    return new Promise((resolve, reject) => {
      let stateCode = state.stateFilter ? state.stateFilter.code : null
      if (!stateCode) return commit('setStatus', {type: 'error', scope: 'app', msg: 'State not specified!'})
      let localeType = state.geographicLevel ? state.geographicLevel.code.toLowerCase() : null
      let locales = state.localeList.length > 0 ? _.map(_.filter(state.localeList, 'selected'), locale => locale.name).join(',') : null
      let query = ''
      if (stateCode && localeType && locales) query = `?${localeType}=${encodeURI(locales)}`
      let querystring = `/api/states/${stateCode}/disasters${query}`

      axios.get(querystring).then(response => {
        console.log(`calling updateReportDisasterList with ${JSON.stringify(_.map(response.data, d => d.disasterNumber))}`)
        commit('updateReportDisasterList', response.data)
        if (response.data && response.data.length === 0) {
          return commit('setStatus', {type: 'info', scope: 'app', msg: 'No results found!'})
        }
        commit('resetStatus')
        resolve('completed successfully')
      }).catch(err => {
        console.log(`Error fetching disaster list: ${err}`)
        commit('setStatus', {type: 'error', scope: 'app', msg: 'HUD disaster data is unavailable at this time.  Try again later or contact your administrator.'})
        reject(err)
      })
    })
  },

  loadLocales: function ({ commit, state }) {
    return new Promise((resolve, reject) => {
      console.log(`inside loadLocales with state.stateFilter: ${JSON.stringify(state.stateFilter)}`)
      let localType = state.geographicLevel.code.toLowerCase()
      let querystring = `/api/states/${state.stateFilter.code}/${localType}`
      return axios.get(querystring).then(response => {
        commit('updateLocaleList', _.map(response.data, (r) => {
          let name = (localType === 'congrdist') ? `${r.substring(2, 4)}` : r
          return { code: r, name }
        }))
        if (response.data && response.data.length === 0) {
          return commit('setStatus', {type: 'info', scope: 'app', msg: 'No results found!'})
        }
        commit('resetStatus')
        resolve('completed successfully')
      }).catch(err => {
        console.log(`Error fetching locale list: ${err}`)
        commit('setStatus', {type: 'error', scope: 'app', msg: 'HUD locale data is unavailable at this time.  Try again later or contact your administrator.'})
        reject(err)
      })
    })
  },

  loadReportData: function ({ commit }, allFilters) {
    return new Promise((resolve, reject) => {
      if (!allFilters.states) {
        commit('updateReportData', {})
        commit('setShowReport', false)
        commit('setShowReportSpinner', false)
        return
      }
      let formattedQuery = 'cols=' + _.map(conversionList, c => c.column).join(',')
      commit('setShowReportSpinner', true)
      _.forIn(allFilters, (value, key) => {
        if (key !== 'cols') formattedQuery += `&${key}=${value.toString()}`
      })
      return axios.get(`/api/applicants/summary?${formattedQuery}`).then(response => {
        commit('updateReportData', response.data)
        commit('setShowReport', true)
        commit('setShowReportSpinner', false)
        if (response.data && response.data.length === 0) {
          return commit('setStatus', {type: 'info', scope: 'app', msg: 'No results found!'})
        }
        commit('resetStatus')
        resolve('completed successfully')
      }).catch(err => {
        console.log(`Error fetching FEMA data: ${err}`)
        commit('setStatus', {type: 'error', scope: 'app', msg: 'FEMA report data is unavailable at this time.  Try again later or contact your administrator.'})
        reject(err)
      })
    })
  }
}

export const getters = {
  disasterNumberResults: state => {
    return state.disasterList
  },
  localeResults: state => {
    return state.localeList
  },
  showReport: state => {
    return state.showReport
  },
  showReportSpinner: state => {
    return state.showReportSpinner
  },
  stateFilter: state => {
    return state.stateFilter
  },
  localeFilter: state => {
    return _.filter(state.localeList, 'selected')
  },
  disasterFilter: state => {
    return _.filter(state.disasterList, 'selected')
  },
  geographicLevel: state => {
    return state.geographicLevel || ''
  },
  summaryRecords: (state, getters) => {
    let newRec = {}
    _.map(state.summaryRecords, c => {
      if (_.indexOf(getters.selectedSummaryColumns, c.column) > -1) newRec[c.name] = c.value
    })
    return newRec
  },
  summaryColumns: state => {
    return state.summaryColumns
  },
  selectedSummaryColumns: state => {
    return _.map(_.filter(state.summaryColumns, 'selected'), c => c.column)
  }
}

const reportStore = {
  state: {
    disasterList: [],
    geographicLevel: null,
    localeList: [],
    stateFilter: null,
    summaryRecords: [],
    showReport: false,
    showReportSpinner: false,
    summaryColumns: _.map(_.filter(conversionList, c => !c.notInList), sc => {
      return {column: sc.column, name: sc.text, selected: sc.selected}
    })
  },
  actions,
  mutations,
  getters
}

export default reportStore
