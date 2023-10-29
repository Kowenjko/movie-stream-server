import { IMDBMovie, Movie } from './movies.interfaces'
import { IMDBRequest, convertMovie } from './helper/imdb.helper'
const { searchMovie, getMovie } = IMDBRequest()

export const searchInIMDB = async (query: string): Promise<Partial<IMDBMovie>> => {
  const {
    data: { results }
  } = await searchMovie(query)

  const [movie] = results

  return movie
}
export const getMovieFromIMDB = async (IMDBId: string): Promise<Partial<Movie>> => {
  const { data } = await getMovie(IMDBId)

  return convertMovie(data)
}
