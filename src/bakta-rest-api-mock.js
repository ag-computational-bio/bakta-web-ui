const api = function () {
    let data = {
        jobs: []
    }

    function persist() {
        window.localStorage.setItem("bakta-mock-jobs", JSON.stringify(data))
    }
    function load() {
        const saved = window.localStorage.getItem("bakta-mock-jobs")
        if (saved === null) {
            data = {
                jobs: []
            }
        } else {
            data = JSON.parse(saved)
        }
    }
    // eslint-disable-next-line no-unused-vars
    function clear() {
        window.localStorage.removeItem("bakta-mock-jobs")
    }
    function getJobs(jobs) {
        // find the jobs that are present in jobs
        let list = data.jobs.filter(job => {
            return jobs.some(requested => job.jobID === requested.jobID && job.secret === requested.secret)
        })
        return list
    }

    load()
    console.log("Loaded persisted mock data: ", data)
    return {
        data: function () {
            return data
        },
        version: function () {
            return new Promise(resolve =>
                resolve({ 'toolVersion': 'v0.5', 'dbVersion': 'v1.1.0' })
            )
        },
        init: function () {
            return new Promise(r => {
                let job = { 'jobID': 'id' + data.jobs.length, 'secret': 'secret' + data.jobs.length, 'jobStatus': "INIT" }
                data.jobs.push(job)
                persist()
                r({ jobID: job.jobID, secret: job.secret })
            })
        },
        list: function (jobs) {
            return new Promise(r => {
                r(getJobs(jobs.jobs))
            })
        },
        // result: function (job) {

        // },
        start: function (request) {
            return new Promise((resolve, reject) => {
                const jobs = getJobs([request.job])

                if (jobs.length != 1) {
                    // nothing
                    reject("Job not found")
                } else {
                    jobs[0].jobStatus = "RUNNING"
                    jobs[0].config = request.config
                    persist()

                    window.setTimeout(
                        () => {
                            jobs[0].jobStatus = "SUCCESSFULL"
                            persist()
                        }, 2000);
                    // mimick slow connection by waiting for a second
                    setTimeout(() => resolve({}), 1000)
                }
            })
        },
        upload: function () {
            return Promise.resolve()
        }
    }
}

const BaktaRestApi = {
    // eslint-disable-next-line no-unused-vars
    install: (app, options) => {
        // register the api globally
        app.config.globalProperties.$baktaApi = api()
    }
}

// allow direct access to api
export { api }
// export vue plugin as default
export default BaktaRestApi