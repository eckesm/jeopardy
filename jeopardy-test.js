describe('test getCategoryIds()',function(){
  it('should return a random sample of categories numbering numCategories',async function(){
    const res=await getCategoryIds(6,5)
    expect(res).toHaveSize(6)
  })
})

describe('test getCategory()',function(){
  it('should return an object with a category title "royal movies?" and 5 clues',async function(){
    const res=await getCategory('11602')
    expect(res.title).toEqual('royal movies?')
    expect(res.clues).toHaveSize(5)
  })

  it('should return an object with a category title "prehistoric times" and 10 clues',async function(){
    const res=await getCategory('5412')
    expect(res.title).toEqual('prehistoric times')
    expect(res.clues).toHaveSize(10)
  })

  it('should return a clue object with question, answer, showing null, and value',async function(){
    const res=await getCategory('12214')
    expect(res.title).toEqual('the constitution today')
    expect(res.clues).toHaveSize(5)
    expect(res.clues[1].question).toEqual("It's paired with conviction in Article II, Section 4, & unpopular presidents start to hear talk of it")
    expect(res.clues[1].answer).toEqual('impeachment')
    expect(res.clues[1].showing).toEqual(null)
    expect(res.clues[1].value).toEqual(400)
  })
})