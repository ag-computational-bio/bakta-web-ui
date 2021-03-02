import { api } from '@/bakta-rest-api-mock'


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
    return job
}

function generateRepliconTable(replicons) {
    return replicons.map(x => [x.id, x.new, x.type, x.topology, x.name].join("\t")).join("\t")
}

// eslint-disable-next-line no-unused-vars
function upload(job, type, data) {
    return new Promise(r => r(job))
}

const BaktaService = {
    /** Vue plugin registration */
    install: (app) => {
        let _api = api()
        app.config.globalProperties.$bakta = {
            version: function () {
                return _api.version()
            },
            // eslint-disable-next-line no-unused-vars
            /** Submits a job to the rest api */
            submit: function (request) {
                // init the job
                let request2 = null
                return _api.init()
                    // store job information to local database
                    .then(job => saveJob(job))
                    // upload files
                    .then(job => {
                        console.debug("Uploading fasta")
                        return upload(job, "uploadLinkFasta", request.sequence)
                    })
                    .then(job => {
                        const replicons = generateRepliconTable(request.replicons)
                        console.debug("Uploading replicon table", replicons)
                        return upload(job, "uploadLinkReplicons", replicons)
                    })
                    .then(job => {
                        if (request.prodigal !== null) {
                            console.debug("Uploading prodigal file")
                            return upload(job, "uploadLinkProdigal", request.prodigal)
                        } else {
                            return new Promise(r => r(job))
                        }
                    })
                    // start the job
                    .then(job => {
                        request2 = { job: job, config: request.options }
                        console.debug("Sending request", request2)
                        return _api.start(request2)
                    })
                    .then(() => new Promise(r => {
                        request2.job.key = jobKey(request2.job)
                        r(request2)
                    }))

            },
            /** Retrieves a list of all known jobs */
            jobs: function () {
                return new Promise(r => {
                    let jobs = JSON.parse(window.localStorage.getItem("bakta-jobs"))
                    if (jobs === null) {
                        jobs = []
                    }
                    r(jobs.map(x => JSON.parse(atob(x))))
                })
                    .then(jobs => {
                        console.log(jobs)
                        return _api.list({ jobs: jobs })
                    })
                    .then(jobs => {
                        return new Promise(
                            r => r(
                                jobs.map(j => {
                                    j.key = jobKey(j)
                                    return j
                                }
                                )
                            )
                        )
                    })
            },
            job: function (job) {
                return _api.list({ jobs: [job] })
                    .then(jobs => {
                        return new Promise(
                            r => r(
                                jobs.map(j => {
                                    j.key = jobKey(j)
                                    return j
                                }
                                )
                            )
                        )
                    })
            }
        }
    }
}

export default BaktaService