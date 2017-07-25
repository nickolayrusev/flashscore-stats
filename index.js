import fetch from 'node-fetch'
import $ from 'cheerio'
import fs from 'fs'
import {inspect} from 'util'
import _ from 'lodash'
import Game from './Game'

/**
 * [{id:'lalala', state:'n/a'}]
 * @returns {Promise.<*|Array>}
 */
const fetchGames = async () => {
    const result = await fetch('http://www.flashscore.mobi/').then(r => r.text());
    const ids = $('div[id=score-data] > a', result).map((i, e) => {
            let championship = $(e).prevAll('h4').first().text();
            return {
                id: $(e).attr('href'),
                state: $(e).text(),
                isLive: $(e).attr('class') === 'live',
                championship: championship
            }
        }
    ).get();
    return ids.map(e => ({
        id: e.id.substring(7, 15),
        status: e.state,
        isLive: e.isLive,
        championship: e.championship
    }))
};

/**
 *
 * @param ids
 * @param all
 * @returns {Array}
 */
const fetchHeadToHeadFeed = (ids, all = false) => {
    if (!all)
        ids = ids.slice(0, 5)
    return ids.map(i => {
        const id = i.id,
            state = i.status,
            isLive = i.isLive,
            championship = i.championship;

        const HEAD_TO_HEAD_FEED = `http://d.flashscore.com/x/feed/d_hh_${id}_en_1`;
        return fetch(HEAD_TO_HEAD_FEED, {headers: {'X-Fsign': 'SW9D1eZo'}}).then(r => r.text()).then(text => ({
            text,
            id,
            state,
            isLive,
            championship
        }))
    })
};

const extractHeadToHead = ({text, state, isLive, championship}) => {
    return $('#tab-h2h-overall .h2h_mutual', text).map((i, e) => {
        const title = $('table thead > tr', e).text().substring('Head-to-head matches: '.length);

        const games = $('table tbody > tr', e).map((ri, r) => {
            let cols = $('td', r);
            if (cols.length > 1)
                return {
                    date: $(cols[0]).text(),
                    league: $(cols[1]).text(),
                    home: $(cols[2]).text(),
                    away: $(cols[3]).text(),
                    score: $(cols[4]).text()
                };
        }).get();
        return {title, games, state, isLive, championship}
    }).get()[0]
};

const computeStats = (game, size = 5) => {
    const games = game.games.slice(0, size).map(g => (new Game(g).toObject()))
    return {
        ...game,
        games: games,
        overPercentage: games.length === 0 ? '0%' : Math.round(games.filter(g => g.isOver).length / games.length * 100) + '%',
        underPercentage: games.length === 0 ? '0%' : Math.round(games.filter(g => g.isUnder).length / games.length * 100) + '%',
        bothTeamsToScorePercentage: games.length === 0 ? '0%' : Math.round(games.filter(g => g.bothTeamsScored).length / games.length * 100) + '%',
        averageGoals: games.length === 0 ? 0 : (_.sum(games.map(t => t.totalGoals)) / games.length).toFixed(2),
        size: games.length
    }
};

(async () => {
    const ids = await fetchGames();
    const result = await Promise.all(fetchHeadToHeadFeed(ids, true));
    console.log('result is ', result.length);

    const obj = result.reduce((i, n) => {
        let stats = computeStats(extractHeadToHead(n))
        return [...i, stats]
    }, []);

    fs.writeFile('result' + '.json', JSON.stringify(obj), function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("The file was written!");
    });

})();
