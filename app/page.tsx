export default function Home() {
  return (
    <main>

      {/* Start Slider Area */}
      <div
        className="slider-area slider-style-1 variation-default slider-bg-image bg-banner1 slider-bg-shape"
        data-black-overlay="1"
      >
        <div className="container">
          <div className="row justify-content-center">

            {/* TEXTO */}
            <div className="col-lg-12">
              <div className="inner text-center mt--140">
                <h1 className="title display-one">
                  O teu cartão digital
                  <br />
                  <span className="theme-gradient">inteligente</span>
                </h1>

                <p className="description">
                  Cria, partilha e gere o teu cartão digital profissional
                  <br />
                  num só link, em segundos.
                </p>

                <div className="form-group">
                  <a className="btn-default" href="/signup">
                    Criar cartão grátis
                  </a>
                </div>
              </div>
            </div>

            {/* HERO VISUAL */}
            <div className="col-lg-11 col-xl-11 justify-content-center">
              <div className="slider-frame kardme-showcase">

                {/* iPhone traseiro */}
                <img
                  src="/assets/kardme/iphone/iphone-back.png"
                  className="iphone-back"
                  alt="iPhone back"
                />

                {/* iPhone frontal */}
                <div className="iphone-front-wrapper">
                  <img
                    src="/assets/kardme/iphone/iphone-front.png"
                    className="iphone-front"
                    alt="iPhone front"
                  />

                  {/* Cartões */}
                  <div className="card-carousel">
                    <img src="/assets/kardme/cards/card-1.png" alt="Card 1" />
                    <img src="/assets/kardme/cards/card-2.png" alt="Card 2" />
                    <img src="/assets/kardme/cards/card-3.png" alt="Card 3" />
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* BACKGROUND SHAPES (fora da row) */}
        <div className="bg-shape">
          <img
            className="bg-shape-one"
            src="/assets/images/bg/bg-shape-four.png"
            alt="Bg Shape"
          />
          <img
            className="bg-shape-two"
            src="/assets/images/bg/bg-shape-five.png"
            alt="Bg Shape"
          />
        </div>

      </div>
      {/* End Slider Area */}

    </main>
  )
}
