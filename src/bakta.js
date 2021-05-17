import { api } from '@/bakta-rest-api'
import { expectOk } from "@/fetch-helper"

function jobKey(job) {
    return btoa(JSON.stringify({ jobID: job.jobID, secret: job.secret }))
}

function saveJob(job) {
    let jobs = JSON.parse(window.localStorage.getItem("bakta-jobs"))
    if (jobs === null) {
        jobs = new Set()
    } else {
        jobs = new Set(jobs)
    }
    const job_token = jobKey(job)
    jobs.add(job_token)
    window.localStorage.setItem("bakta-jobs", JSON.stringify(Array.from(jobs)))
    return Promise.resolve(job)
}

function loadJobs() {
    let jobs = JSON.parse(window.localStorage.getItem("bakta-jobs"))
    if (jobs === null) {
        jobs = []
    }
    let parsed = jobs.map(x => JSON.parse(atob(x)))
    return parsed
}

function generateRepliconTable(replicons) {
    return replicons.map(x => [x.id, x.new, x.type, x.topology, x.name].join("\t")).join("\t")
}

// eslint-disable-next-line no-unused-vars
function upload(_api, job, type, data) {
    const url = job[type]
    return _api.upload(url, data)
        .then(expectOk)
        .then(() => Promise.resolve(job))

}

function loadKeys(localJobs, retrievedJobs) {
    return retrievedJobs.map(
        job => {
            const localJob = localJobs.filter(j => j.jobID == job.jobID)[0]
            job.key = jobKey(localJob);
            job.secret = localJob.secret
            return job
        })
}

/**
 * Methods of the bakta service return a promise with either 
 * the response json object or an error object if the return
 * code is not okay.
 */
const BaktaService = {
    /** Vue plugin registration */
    install: (app, options) => {
        let _api = api(options)
        app.config.globalProperties.$bakta = {
            version: function () {
                return _api.version()
            },
            // eslint-disable-next-line no-unused-vars
            /** Submits a job to the rest api */
            submit: function (request) {
                // init the job
                return _api.init()
                    .then(job => {
                        // store job information to local database
                        saveJob(job.job)

                        const replicons = generateRepliconTable(request.replicons)
                        const jobRequest = { job: job.job, config: request.options }
                        // upload files
                        return upload(_api, job, "uploadLinkFasta", request.sequence)
                            .then(() => upload(_api, job, "uploadLinkReplicons", replicons))
                            .then(() => upload(_api, job, "uploadLinkProdigal", request.prodigal))
                            // submit job
                            .then(() => _api.start(jobRequest))
                            .then(() => {
                                // add jobkey for further processing, really needed???
                                jobRequest.job.key = jobKey(jobRequest.job)
                                return Promise.resolve(jobRequest)
                            })
                    }
                    )
            },
            /** Retrieves a list of all known jobs */
            jobs: function () {
                let _jobs = loadJobs()
                return _api.list({ jobs: _jobs })
                    .then(jobs => Promise.resolve(loadKeys(_jobs, jobs.jobs)))
            },
            job: function (job) {
                let _jobs = loadJobs()
                return _api.list({ jobs: [job] })
                    .then(jobs => Promise.resolve(loadKeys(_jobs, jobs.jobs)))
            },
            result: function (job) {
                return _api.result(job)
            }
        }
    }
}

export default BaktaService