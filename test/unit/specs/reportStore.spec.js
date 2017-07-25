/* global describe, it, expect, beforeEach */
import 'es6-promise/auto' // eslint-disable-line
import _ from 'lodash'
import axios from 'axios' // eslint-disable-line
import moxios from 'moxios' // eslint-disable-line
import { mutations, actions, getters } from '../../../src/reportStore' // eslint-disable-line
import sinon from 'sinon'
import should from 'should'
const { updateDisasterList, updateLocaleList, clearState } = mutations
const { loadReportDisasterList, loadLocales } = actions

const TWO_RECORDS = [
  {'disasterNumber': 4289,
    'state': 'IA',
    'declarationDate': 'October 31, 2016',
    'disasterType': 'DR',
    'incidentType': 'Flood',
    'title': 'SEVERE STORMS AND FLOODING',
    'declaredCountyArea': ['Buchanan (County)', 'Delaware (County)', 'Howard (County)'],
    'placeCode': 99019,
    'id': '5817ea93289b6425072e20eb'
  },
  {'disasterNumber': 4281,
    'state': 'IA',
    'declarationDate': 'September 29, 2016',
    'disasterType': 'DR',
    'incidentType': 'Flood',
    'title': 'SEVERE STORMS, STRAIGHT-LINE WINDS, AND FLOODING',
    'declaredCountyArea': ['Winneshiek (County)', 'Clayton (County)'],
    'placeCode': 99191,
    'id': '57edac84c7e7c327077fc494'
  } ]

const TWO_LOCALES = ['Morley', 'Anamosa']

describe('reportStore', function () {
  describe('updateDisasterList', function () {
    it('should set disasterNumbers', function () {
      let state = { disasterList: [] }
      let disasterNumberResults = getters.disasterNumberResults
      updateDisasterList(state, TWO_RECORDS)
      expect(state.disasterList.length).to.be.equal(2)
      expect(disasterNumberResults(state).length).to.be.equal(2)
    })
  })
  describe('updateLocaleList', function () {
    it('should set localeList', function () {
      let state = { localeList: [] }
      let localeResults = getters.localeResults
      updateLocaleList(state, TWO_LOCALES)
      expect(state.localeList.length).to.be.equal(2)
      expect(localeResults(state).length).to.be.equal(2)
    })
  })

  describe('loadReportDisasterList', function () {
    it('should call commit for setSearchLoading and updateDisasterList when the data is loaded', function (done) {
      moxios.install()
      moxios.stubRequest(/WI/, {
        status: 200,
        response: _.clone(TWO_RECORDS)
      })
      let updateDisasterListCalled
      let resetStatus
      var commitStub = sinon.stub().callsFake((name, data) => {
        if (name === 'updateDisasterList' && data) {
          expect(data).to.be.an('array')
          updateDisasterListCalled = true
        }
        if (name === 'resetStatus') resetStatus = true
      })
      loadReportDisasterList({ commit: commitStub }, 'WI')
      moxios.wait(() => {
        expect(updateDisasterListCalled).to.be.equal(true)
        expect(resetStatus).to.be.equal(true)
        done()
      })
    })
  })

  describe('loadLocales', function () {
    it('should call commit for setSearchLoading and updateLocaleList when the data is loaded', function (done) {
      moxios.install()
      moxios.stubRequest(/TX/, {
        status: 200,
        response: _.clone(TWO_LOCALES)
      })
      let updateLocaleListCalled
      var commitStub = sinon.stub().callsFake((name, data) => {
        if (name === 'updateLocaleList') updateLocaleListCalled = true
      })
      loadLocales({ commit: commitStub, state: { geographicLevel: { name: 'City' } } }, 'TX')
      moxios.wait(() => {
        expect(updateLocaleListCalled).to.be.equal(true)
        done()
      })
    })

    it('should setStatus to No results found if data returned is empty', function (done) {
      moxios.install()
      moxios.stubRequest(/TZ/, {
        status: 200,
        response: []
      })
      let updateLocaleListCalled
      let setSearchLoadingCalled
      let setStatusCalled
      var commitStub = sinon.stub().callsFake((name, data) => {
        if (name === 'updateLocaleList') updateLocaleListCalled = true
        if (name === 'setSearchLoading') setSearchLoadingCalled = true
        if (name === 'setStatus') {
          should(data).be.an.Object().and.have.properties({msg: 'No results found!'})
          setStatusCalled = true
        }
      })
      loadLocales({ commit: commitStub, state: { geographicLevel: { name: 'City' } } }, 'TZ')
      moxios.wait(() => {
        expect(updateLocaleListCalled).to.be.equal(true)
        expect(setSearchLoadingCalled).to.be.equal(true)
        expect(setStatusCalled).to.be.equal(true)
        done()
      })
    })
  })

  describe('clearState', function () {
    it('should set state.disasterNumbers and state.localeList to empty arrays', function () {
      let state = {}
      clearState(state)
      should(state.disasterList).be.an.Array().and.have.length(0)
      should(state.localeList).be.an.Array().and.have.length(0)
    })
  })
})
